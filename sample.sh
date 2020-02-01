echo 'sample sh script';
cd /home/devesh/Desktop/myapp/;
fuser -k 3000/tcp;
killall -9 node;
npm start;