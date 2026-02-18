# SSL Certificate Placeholder

Place your SSL certificates here:

- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key

## For Development (Self-Signed)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem -out fullchain.pem \
  -subj "/CN=localhost"
```

## For Production (Let's Encrypt)

Use Certbot to generate certificates:

```bash
docker run -it --rm -v "./nginx/ssl:/etc/letsencrypt" \
  -v "./nginx/certbot:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.talentbridge.com \
  -d talentbridge.com
```

Then copy certificates:

```bash
cp /etc/letsencrypt/live/talentbridge.com/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/talentbridge.com/privkey.pem ./nginx/ssl/
```
