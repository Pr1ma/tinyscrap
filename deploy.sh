#!/bin/bash
echo 'coping files to tyniscrap' &&
rsync -avz -e 'ssh -i ~/.ssh/digital_ocean' --progress --exclude=node_modules ./* root@188.166.150.231:/app/tinyscrap &&
# copy secret config
echo 'restart pm2' &&
ssh -i ~/.ssh/digital_ocean root@188.166.150.231 'pm2 restart index' &&
echo 'ok'
