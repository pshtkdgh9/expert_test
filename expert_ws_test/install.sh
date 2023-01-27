#Install web service modules
yum install -y nodejs
npm install express
npm install moment-timezone
npm install winston
npm install winston-daily-rotate-file
npm install cors
#iptables -F
#echo "export SERVER_DOMAIN=$(curl https://ipecho.net/plain ; echo)" >> /etc/profile 
