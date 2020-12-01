# AUTO-HOST-GCLOUD

Automatic deployment and continuous deployment of react/nodejs applications to gcloud compute engine.

## Instructions ##

Add this page to your favorite nodejs application to launch and host with continual deployments from your local computer! Note: You must set up google cloud authentication prior.

Follow this tutorial to get started: https://cloud.google.com/compute/docs/tutorials/ssh-with-sk.

### Setup ###


#### Set up API ###

::Windows::

Follow these instructions to get google cloud sdk console

https://cloud.google.com/sdk/docs/install

::Linux::

Open a terminal and download Google SKD Shell

```wget https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-265.0.0-linux-x86_64.tar.gz```

```tar -zxf google-cloud-sdk-*```

```cd google-cloud-sdk```

```./install.sh```

Close and open a new terminal

::In Terminal or in windows cloud sdk console::

Initialize SKD Shell and log in. Follow instructions to choose or create project and set time zone.

```gcloud init```

Upgrade SDK components

```gcloud components update```

Set Project
```gcloud config set project <PROJECT NAME>```

Set login credentails
```gcloud auth application-default login```

#### Authenticate with Cloud ####

Create service account:

```gcloud iam service-accounts create service```
 ** You can replace 'service' with whatever you would like your account name to be

Get project ID

```gcloud projects list```

Bind policy

 ```gcloud projects add-iam-policy-binding PROJECT_ID --member="serviceAccount:NAME@PROJECT_ID.iam.gserviceaccount.com" --role="roles/owner"```

 Generate Key

 ```gcloud iam service-accounts keys create FILE_NAME.json --iam-account=NAME@PROJECT_ID.iam.gserviceaccount.com```


 Setting the environment variable. PATH is where ever you stored the json key
 ```export GOOGLE_APPLICATION_CREDENTIALS="[PATH]"```

### SSH to App ###

From google cloud sdk
```gcloud compute ssh goldfish-app --zone=us-west1-b```

#### Set up App ####

Setup instructions using npm.

Install npm, sqlite3, python3, pip3, and openssh-server

```sudo apt install npm```


Load existing npm module
``` npm i```

Start app at localhost:3000

```npm start```

### Troubleshooting ###

The files do not transfer: Zone error

In the watcher.sh script, change 'us-west1-b' to the timezone of your database instance.

Cannot Find @Google-cloud-compute:

Go to API setup instructions and reinstall google cloud sdk, then update componenets

```gcloud components update```
