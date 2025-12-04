# Development SSL Certificates

These files are self-signed certificates for localhost development only.

- `localhost.pem` - SSL certificate
- `localhost-key.pem` - Private key

**Security:** These are safe to commit because:
1. They only work for `localhost` (CN=localhost)
2. They're only trusted on dev machines that run `.\register.ps1`
3. They cannot be used for production or other domains

The `register.ps1` script automatically trusts the certificate when setting up the add-in.
