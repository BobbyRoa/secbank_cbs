# Secbank CBS - CI/CD Pipeline Setup Guide

This guide explains how to configure the GitHub Actions CI/CD pipeline for automated building, testing, and deployment of the Secbank Core Banking System.

---

## Pipeline Overview

The CI/CD pipeline automates the entire software delivery process, from code commit to production deployment. When you push code to the main branch, the pipeline automatically runs tests, builds Docker images, pushes them to AWS ECR, and deploys to your infrastructure.

| Stage | Trigger | Actions |
|-------|---------|---------|
| **Test** | Push/PR to main | TypeScript check, unit tests |
| **Build** | After tests pass | Build frontend and backend Docker images |
| **Push** | After build succeeds | Push images to AWS ECR with commit SHA and latest tags |
| **Deploy** | After push succeeds | Deploy to EC2 or ECS (configurable) |

---

## Prerequisites

Before enabling the CI/CD pipeline, you need to complete the following setup steps on AWS:

### 1. Create ECR Repositories

The pipeline pushes Docker images to Amazon Elastic Container Registry (ECR). Create two repositories using the AWS CLI or Console:

```bash
# Create backend repository
aws ecr create-repository \
  --repository-name secbank-backend \
  --region ap-southeast-1 \
  --image-scanning-configuration scanOnPush=true

# Create frontend repository
aws ecr create-repository \
  --repository-name secbank-frontend \
  --region ap-southeast-1 \
  --image-scanning-configuration scanOnPush=true
```

### 2. Create IAM User for GitHub Actions

Create an IAM user with programmatic access and attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    }
  ]
}
```

Save the Access Key ID and Secret Access Key for configuring GitHub secrets.

### 3. Prepare EC2 Instance (for EC2 deployment)

If deploying to EC2, ensure your instance has Docker installed and the AWS CLI configured:

```bash
# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
```

---

## GitHub Secrets Configuration

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `DATABASE_URL` | MySQL connection string for tests | `mysql://user:pass@host:3306/secbank` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-super-secret-jwt-key-here` |
| `EC2_HOST` | EC2 public IP or hostname | `ec2-12-34-56-78.compute-1.amazonaws.com` |
| `EC2_USERNAME` | SSH username | `ec2-user` |
| `EC2_SSH_KEY` | Private SSH key (PEM format) | `-----BEGIN RSA PRIVATE KEY-----...` |

### Adding Secrets via GitHub CLI

You can also add secrets using the GitHub CLI:

```bash
# Login to GitHub CLI
gh auth login

# Add secrets
gh secret set AWS_ACCESS_KEY_ID --body "your-access-key-id"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret-access-key"
gh secret set DATABASE_URL --body "mysql://user:pass@host:3306/secbank"
gh secret set JWT_SECRET --body "your-jwt-secret-min-32-chars"
gh secret set EC2_HOST --body "your-ec2-public-ip"
gh secret set EC2_USERNAME --body "ec2-user"
gh secret set EC2_SSH_KEY < ~/.ssh/your-ec2-key.pem
```

---

## Pipeline Configuration

The pipeline is defined in `.github/workflows/ci-cd.yml`. Here are the key configuration options:

### Changing AWS Region

Update the `AWS_REGION` environment variable at the top of the workflow file:

```yaml
env:
  AWS_REGION: ap-southeast-1  # Change to your region
```

### Switching Between EC2 and ECS Deployment

By default, the pipeline deploys to EC2. To switch to ECS deployment:

1. Open `.github/workflows/ci-cd.yml`
2. Set `if: false` on the `deploy-ec2` job
3. Set `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` on the `deploy-ecs` job

### Disabling Deployment

To only build and push images without deploying, set `if: false` on both deployment jobs.

---

## Pipeline Stages Explained

### Stage 1: Test

The test stage runs on every push and pull request to the main branch. It performs TypeScript type checking and runs all vitest unit tests. If any test fails, the pipeline stops and does not proceed to building images.

### Stage 2: Build

After tests pass, the build stage creates Docker images for both frontend and backend services. Images are tagged with the Git commit SHA for traceability. The stage uses Docker Buildx with GitHub Actions cache for faster builds.

### Stage 3: Push to ECR

The push stage authenticates with AWS ECR and pushes both images with two tags: the commit SHA (for rollback capability) and `latest` (for easy deployment). This ensures you can always deploy a specific version if needed.

### Stage 4: Deploy

The deployment stage connects to your EC2 instance via SSH, pulls the latest images from ECR, and restarts the Docker Compose services. For ECS deployment, it triggers a new deployment using the AWS CLI.

---

## Monitoring Pipeline Runs

You can monitor pipeline runs in several ways:

1. **GitHub Actions Tab**: Navigate to your repository → Actions to see all workflow runs
2. **Email Notifications**: GitHub sends email notifications on workflow failures
3. **Status Badges**: Add a status badge to your README:

```markdown
![CI/CD](https://github.com/BobbyRoa/secbank_cbs/actions/workflows/ci-cd.yml/badge.svg)
```

---

## Troubleshooting

### Common Issues

**Tests fail with database connection error:**
Ensure the `DATABASE_URL` secret is correctly configured and the database is accessible from GitHub Actions runners.

**ECR push fails with authentication error:**
Verify that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct and the IAM user has the required permissions.

**EC2 deployment fails with SSH error:**
Check that `EC2_HOST`, `EC2_USERNAME`, and `EC2_SSH_KEY` are correctly configured. Ensure the EC2 security group allows SSH from GitHub Actions IP ranges.

**Docker build fails with memory error:**
GitHub Actions runners have limited resources. Consider optimizing your Dockerfiles or using larger runners.

### Viewing Logs

To view detailed logs for a failed job:

1. Go to Actions tab in your repository
2. Click on the failed workflow run
3. Click on the failed job
4. Expand the failed step to see detailed logs

---

## Security Best Practices

1. **Rotate AWS credentials regularly** and update GitHub secrets accordingly
2. **Use environment protection rules** for production deployments requiring approval
3. **Enable branch protection** to require PR reviews before merging to main
4. **Limit IAM permissions** to only what the pipeline needs
5. **Use OIDC authentication** instead of long-lived credentials when possible

---

## Extending the Pipeline

### Adding Staging Environment

To add a staging deployment, duplicate the deploy job and modify it:

```yaml
deploy-staging:
  name: Deploy to Staging
  runs-on: ubuntu-latest
  needs: push-to-ecr
  environment: staging
  # ... rest of deployment steps with staging-specific secrets
```

### Adding Slack Notifications

Add a notification step at the end of the workflow:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author,action,eventName,ref,workflow
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  if: always()
```

---

*Last updated: January 2026*
