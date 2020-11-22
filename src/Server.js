// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const repo = 'https://github.com/bentotten/goldfish.git'

// You must have a project already and your google account synced for this to work! See README.md

'use strict';

async function main(name = 'start-script-example') {
  // [START gce_startup_script]
  const Compute = require('@google-cloud/compute');
  const fetch = require('node-fetch');

  // See https://github.com/googleapis/nodejs-compute/blob/master/samples/startupScript.js for help script

  // Creates a client
  const compute = new Compute();
  const zone = compute.zone('us-west1-b');
  const vmName = 'goldfish-app';
  const testVM = zone.vm(vmName);

  testVM.exists(function (err, exists) {
    if (exists) {
      console.log(`VM Instance already exists`)
    }

    else if (!exists) {
      // Create a new VM 
      async function VM() {

        const name = 'goldfish-app';
        const vm = zone.vm(name);

        // Setup and install after creation. This also installs and starts the bash script watcher.sh which waits for a file to be uploaded and sends it to the database
        // Currently set to send test.txt, TODO: Change this to sqlite db before launch
        const config = {
          os: 'ubuntu',
          http: true,
          metadata: {
            items: [
              {
                key: 'startup-script',
                value: `#! /bin/bash
                echo "Startup Started" > /var/www/log.txt
                export HOME=/root
                echo "export HOME=/root" >> /var/www/log.txt

                apt-get update
                apt-get install -y inotify-tools tmux git nginx build-essential supervisor npm
                echo "installed dependencies" >> /var/www/log.txt

                mkdir /var/www

                apt-get -y upgrade
                echo "Startup-Ran" >> /var/www/log.txt

                /var/www/goldfish/backend/deployment.sh
                #Log
                echo "Starting Deployment" >>/var/www/log.txt

                # Go to proper dir
                cd /var/www/

                # Install nodejs
                mkdir /var/www/nodejs
                curl https://nodejs.org/dist/v8.12.0/node-v8.12.0-linux-x64.tar.gz | tar xvzf - -C /opt/nodejs --strip-components=1
                ln -s /var/www/nodejs/bin/node /usr/bin/node
                ln -s /var/www/nodejs/bin/npm /usr/bin/npm

                echo "Installed nodejs" >>/var/www/log.txt

                # Create a nodeapp user. The application will run as this user.
                useradd -m -d /home/nodeapp nodeapp
                chown -R nodeapp:nodeapp /opt/app
                USER = 'nodeapp'

                echo "created nodeapp user" >>/var/www/log.txt

                # Fix NPM's issues
                npm cache clean -f
                npm install -g n
                n stable
                echo "Installed fresh npm" >>/var/www/log.txt

                # git repo and install dependencies
                git config --global credential.helper gcloud.sh
                # Clone repo and then install npm dependencies. && prevents async install of npm dep before repo is installed
                git -C /var/www clone ${repo} && npm i --prefix /var/www/goldfish
                echo "cloned repo" >> /var/www/log.txt

                #npm i --prefix /var/www/goldfish
                npm audit fix --prefix /var/www/goldfish
                npm run build --prefix /var/www/goldfish
                echo "website built" >>/var/www/log.txt

# IMPORTANT! DO NOT FORMAT THESE LINES! CONFIG FILE CANNOT READ THE WHITE SPACE!
                cat > /etc/supervisor/conf.d/node-app.conf <<EOF
[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
numprocs=1
startsecs=0
process_name=%(program_name)s_%(process_num)02d
user=nodeapp
environment=HOME="/home/nodeapp",USER="nodeapp",NODE_ENV="production"
stderr_logfile=/var/log/supervisor/%(program_name)s_stderr.log
stderr_logfile_maxbytes=10MB
stdout_logfile=/var/log/supervisor/%(program_name)s_stdout.log
stdout_logfile_maxbytes=10MB
EOF

                supervisorctl reread
                supervisorctl update
                echo supervisorctl >> /var/www/log.txt
                echo "Supervisor created and launched" >>/var/www/log.txt

                echo "deployment-Ran" >>/var/www/log.txt

                echo "Starting firewall rules" >>/var/www/log.txt

                gcloud compute firewall-rules create default-allow-http-8080 \
                --allow tcp:8080 \
                --source-ranges 0.0.0.0/0 \
                --target-tags http-server \
                --description "Allow port 8080 access to http-server"

                echo "gcloud-Ran" >> /var/www/log.txt

                echo "Done" >>/var/www/log.txt
                `,
              },
            ],
          },
        }



        // Start the VM creation
        console.log(`Creating VM ${name}...`);
        const [, operation] = await vm.create(config);
        //const [, operation] = await vm.get(config);

        // `operation` lets you check the status of long-running tasks.
        console.log(`Polling operation ${operation.id}...`);
        await operation.promise();

        // Get metadata
        console.log('Acquiring VM metadata...');
        const [metadata] = await vm.getMetadata();

        // External IP of the VM.
        const ip = metadata.networkInterfaces[0].accessConfigs[0].natIP;
        console.log(`Booting new VM with IP http://${ip}...`);


        // Ping the VM to determine when the HTTP server is ready.
        console.log('Operation complete. Waiting for IP');
        await pingVM(ip);

        console.log(`\n${name} created succesfully`);

        // Complete!
        console.log('Virtual machine created!');

      }



      //   * Poll a given IP address until it returns a result.
      //   * @param {string} ip IP address to poll
      //   
      async function pingVM(ip) {
        let exit = false;
        while (!exit) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            const res = await fetch(`http://${ip}`);
            if (res.status !== 200) {
              throw new Error(res.status);
            }
            exit = true;
          } catch (err) {
            process.stdout.write('.');
          }
        }
      }

      VM();

    }
  }); // For exists()


}

main(...process.argv.slice(2));

