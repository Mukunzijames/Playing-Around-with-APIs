# Web Server Deployment for API Project

[![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)
[![HAProxy](https://img.shields.io/badge/HAProxy-106E9F?style=for-the-badge&logo=haproxy&logoColor=white)](https://www.haproxy.org/)
[![Shell Script](https://img.shields.io/badge/Shell_Script-121011?style=for-the-badge&logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Let's Encrypt](https://img.shields.io/badge/Let's_Encrypt-003A70?style=for-the-badge&logo=letsencrypt&logoColor=white)](https://letsencrypt.org/)

## Overview

This project demonstrates the setup and configuration of a load balancer using HAProxy to distribute traffic between multiple web servers. It includes automated installation scripts, SSL certificate setup, and web server configuration.

### Live Demo

🌐 **Website**: [www.jamesllc.tech](https://www.jamesllc.tech/)

Visit the live website to see the load-balanced setup in action!

## Features

- **Load Balancing**: Round-robin distribution across web-01 and web-02 servers
- **SSL Termination**: HTTPS support with Let's Encrypt certificates
- **Custom HTTP Headers**: X-Served-By header for tracking which server handled the request
- **Automated Deployment**: Shell scripts for fast setup and configuration
- **Live Demo**: Check out the live demo at [www.jamesllc.tech](https://www.jamesllc.tech)

## Process

### Web Server Setup (web-01 & web-02)

1. Clone the repository:
   ```bash
   git clone https://github.com/Mukunzijames/Playing-Around-with-APIs.git
   cd Playing-Around-with-APIs
   ```

2. Deploy web content:
   ```bash
   # Navigate to web directory
   cd /var/www/html
   
   # Remove existing content if necessary
   rm -rf index.html
   
   # Copy new content
   cp -r index.html css js /var/www/html
   ```

3. Reload Nginx to apply changes:
   ```bash
   service nginx reload
   ```

### Automated Deployment Script

For convenience, this process is automated in the `setup_webserver.sh` script. This script:

- Clones the repository
- Sets up web content in the correct directory
- Handles permissions
- Reloads Nginx

#### Using the Script

1. Download the script:
   ```bash
   wget https://raw.githubusercontent.com/Mukunzijames/Playing-Around-with-APIs/main/setup_webserver.sh
   ```

2. Make it executable:
   ```bash
   chmod +x setup_webserver.sh
   ```

3. Run with root privileges:
   ```bash
   sudo ./setup_webserver.sh
   ```

## Load Balancer Configuration

The load balancer is configured to distribute traffic between web-01 and web-02 servers in a round-robin fashion. This ensures even distribution of requests and provides redundancy.

## Maintenance

To update the web content:

1. Make changes to the repository
2. Push to GitHub
3. Run the deployment script on each server (or use a centralized deployment system)

## Troubleshooting

If you encounter issues:

1. Check Nginx status: `systemctl status nginx`
2. Review Nginx error logs: `tail -f /var/log/nginx/error.log`
3. Verify file permissions in the web directory
4. Ensure both web servers are operational

## License

[MIT License](LICENSE)


# 1. Install Certbot if not already installed
sudo apt update
sudo apt install -y certbot

# 2. Stop HAProxy temporarily to free up port 80/443 for the standalone verification
sudo systemctl stop haproxy

# 3. Obtain certificate using standalone mode
sudo certbot certonly --standalone -d www.jamesllc.tech

# 4. Combine certificate and private key files for HAProxy
sudo cat /etc/letsencrypt/live/www.jamesllc.tech/fullchain.pem \
     /etc/letsencrypt/live/www.jamesllc.tech/privkey.pem > /etc/haproxy/www.jamesllc.pem

# 5. Set proper permissions for the combined certificate file
sudo chmod 600 /etc/haproxy/www.jamesllc.pem

# 6. Update HAProxy configuration to use the SSL certificate
# Edit /etc/haproxy/haproxy.cfg and add/modify the frontend section to include:
#
# frontend www-https
#    bind *:443 ssl crt /etc/haproxy/www.jamesllc.pem
#    reqadd X-Forwarded-Proto:\ https
#    default_backend www-backend

# 7. Restart HAProxy to apply changes
sudo systemctl restart haproxy

# 8. Set up auto-renewal for the certificate
# Create a renewal script
sudo bash -c 'cat > /etc/letsencrypt/renewal-hooks/post/haproxy.sh << EOL
#!/bin/bash
cat /etc/letsencrypt/live/www.jamesllc.tech/fullchain.pem \
    /etc/letsencrypt/live/www.jamesllc.tech/privkey.pem > /etc/haproxy/www.jamesllc.pem
chmod 600 /etc/haproxy/www.jamesllc.pem
systemctl reload haproxy
EOL'

# Make the renewal script executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/haproxy.sh

## Author

James Mukunzi
