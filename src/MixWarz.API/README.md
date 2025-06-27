# MixWarz API Configuration

## Setting up appsettings.json

The `appsettings.json` file contains sensitive configuration data and is excluded from the repository for security reasons.

### Setup Instructions

1. Copy `appsettings.json.template` to `appsettings.json`
2. Replace the placeholder values with your actual configuration:

### Required Configuration

#### Database Connection

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=MixWarz;Username=YOUR_USERNAME;Password=YOUR_PASSWORD;..."
}
```

#### JWT Configuration

```json
"Jwt": {
  "Key": "YOUR_JWT_SECRET_KEY_HERE_MINIMUM_256_BITS"
}
```

#### Stripe Configuration

```json
"Stripe": {
  "PublishableKey": "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY",
  "SecretKey": "sk_test_YOUR_STRIPE_SECRET_KEY",
  "WebhookSecret": "whsec_YOUR_WEBHOOK_SECRET_FROM_STRIPE_DASHBOARD"
}
```

### Security Notes

- Never commit `appsettings.json` to version control
- Use environment-specific configuration files for different deployments
- Store sensitive values in secure key management systems in production
- Regularly rotate API keys and secrets
