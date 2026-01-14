# Secbank CBS - AWS Deployment Guide

This guide provides step-by-step instructions for deploying the Secbank Core Banking System on Amazon Web Services (AWS) using Docker containers.

---

## Architecture Overview

The Secbank CBS deployment consists of three containerized services orchestrated via Docker Compose or AWS ECS:

| Service | Technology | Port | Description |
|---------|------------|------|-------------|
| **Frontend** | React + Nginx | 80 | Serves the web application and proxies API requests |
| **Backend** | Node.js + Express + tRPC | 3000 | Handles business logic and API endpoints |
| **Database** | MySQL 8.0 | 3306 | Stores all banking data |

---

## Prerequisites

Before deploying, ensure you have the following:

1. **AWS Account** with appropriate IAM permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Docker** and **Docker Compose** installed locally
4. **Domain name** (optional, for production SSL)

---

## Deployment Options

### Option 1: EC2 with Docker Compose (Recommended for Small Deployments)

This approach runs all services on a single EC2 instance using Docker Compose.

#### Step 1: Launch EC2 Instance

Launch an EC2 instance with the following specifications:

| Setting | Recommended Value |
|---------|-------------------|
| AMI | Amazon Linux 2023 or Ubuntu 22.04 LTS |
| Instance Type | t3.medium (2 vCPU, 4 GB RAM) minimum |
| Storage | 30 GB gp3 SSD |
| Security Group | Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS) |

#### Step 2: Connect and Install Docker

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Install Docker (Amazon Linux 2023)
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
```

#### Step 3: Deploy the Application

```bash
# Clone or upload your project
git clone https://github.com/BobbyRoa/secbank_cbs.git
cd secbank_cbs

# Create environment file
cp docker/env.template .env
nano .env  # Edit with your production values

# Build and start containers
docker-compose up -d --build

# Verify containers are running
docker-compose ps

# Run database migrations
docker-compose exec backend pnpm db:push
```

#### Step 4: Configure SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

---

### Option 2: AWS ECS with Fargate (Recommended for Production)

This approach uses AWS managed container orchestration for better scalability and reliability.

#### Step 1: Create ECR Repositories

```bash
# Create repositories for your images
aws ecr create-repository --repository-name secbank-backend --region ap-southeast-1
aws ecr create-repository --repository-name secbank-frontend --region ap-southeast-1

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com
```

#### Step 2: Build and Push Images

```bash
# Build images locally
cd /path/to/secbank_cbs
chmod +x docker/build-images.sh
./docker/build-images.sh

# Tag and push to ECR
docker tag secbank-backend:latest <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/secbank-backend:latest
docker push <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/secbank-backend:latest

docker tag secbank-frontend:latest <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/secbank-frontend:latest
docker push <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/secbank-frontend:latest
```

#### Step 3: Create RDS MySQL Database

Navigate to AWS RDS Console and create a MySQL database:

| Setting | Value |
|---------|-------|
| Engine | MySQL 8.0 |
| Instance Class | db.t3.micro (dev) or db.t3.medium (prod) |
| Storage | 20 GB gp3 |
| Multi-AZ | Yes (production) |
| Database Name | secbank |
| Master Username | secbank_admin |

Note the endpoint URL for your DATABASE_URL environment variable.

#### Step 4: Create ECS Cluster and Services

1. **Create ECS Cluster**: Navigate to ECS Console → Create Cluster → Choose "AWS Fargate"

2. **Create Task Definitions**: Create task definitions for backend and frontend services with the following configurations:

**Backend Task Definition:**
```json
{
  "family": "secbank-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/secbank-backend:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URL", "value": "mysql://user:pass@rds-endpoint:3306/secbank"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/secbank-backend",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

3. **Create Application Load Balancer**: Create an ALB with listeners on ports 80 and 443

4. **Create ECS Services**: Create services for backend and frontend, connecting them to the ALB target groups

---

### Option 3: AWS Elastic Beanstalk (Simplest)

For the simplest deployment, use AWS Elastic Beanstalk with Docker platform:

```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
cd /path/to/secbank_cbs
eb init -p docker secbank-cbs --region ap-southeast-1

# Create environment
eb create secbank-production

# Deploy updates
eb deploy
```

---

## Environment Variables

The following environment variables must be configured for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/secbank` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | `your-super-secret-key-here` |
| `NODE_ENV` | Environment mode | `production` |
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com` |

---

## Security Best Practices

1. **Use AWS Secrets Manager** for sensitive credentials instead of environment variables
2. **Enable VPC** to isolate your database from public internet
3. **Configure Security Groups** to allow only necessary traffic
4. **Enable CloudWatch Logs** for monitoring and debugging
5. **Set up AWS WAF** to protect against common web attacks
6. **Enable RDS encryption** at rest and in transit
7. **Use IAM roles** instead of access keys where possible

---

## Monitoring and Logging

### CloudWatch Setup

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/secbank-backend
aws logs create-log-group --log-group-name /ecs/secbank-frontend

# Set retention policy
aws logs put-retention-policy --log-group-name /ecs/secbank-backend --retention-in-days 30
```

### Health Checks

Both services expose health check endpoints:

- Frontend: `GET /health` → Returns `healthy`
- Backend: `GET /api/health` → Returns health status JSON

---

## Scaling Considerations

| Traffic Level | Frontend | Backend | Database |
|---------------|----------|---------|----------|
| Low (< 100 users) | 1 instance | 1 instance | db.t3.micro |
| Medium (100-1000) | 2 instances | 2 instances | db.t3.medium |
| High (1000+) | Auto-scaling | Auto-scaling | db.r5.large + Read Replicas |

---

## Troubleshooting

### Common Issues

**Container fails to start:**
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
```

**Database connection errors:**
```bash
# Verify database is accessible
docker-compose exec backend nc -zv database 3306
```

**Frontend cannot reach backend:**
```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

---

## Cost Estimation

| Component | Monthly Cost (USD) |
|-----------|-------------------|
| EC2 t3.medium | ~$30 |
| RDS db.t3.micro | ~$15 |
| EBS Storage (30 GB) | ~$3 |
| Data Transfer | ~$5-10 |
| **Total (Basic)** | **~$50-60** |

For ECS Fargate deployment, expect approximately $80-120/month depending on usage.

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/BobbyRoa/secbank_cbs/issues
- Documentation: See `/docs` folder in the repository

---

*Last updated: January 2026*
