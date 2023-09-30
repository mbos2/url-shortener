# URL Shortenrt

This is URL Shortener application ran by [Appwrite cloud function.](https://appwrite.io), on Appwrite platform.  
This project is part of Appwrites Lightning Hackathon.  

## About

This project is a simple URL Shortener service.  
It contains a form with URL and Alias inputs.

In URL input you add your URL you want shorten.  
In Alias input you write something with what will you recognize what Short URL represents. It is only arbitrary. 

It contains a button that can fetch your Short URLs from a database into the table on the same page.

Here is a project preview:
![Project Preview](image.png)

### Services

This project contains services: 

- Automatic generation of backend resources, like database, collection and attributes once you visit `/` page in your browser. 
- - To manually create backend resources, refer to these 2 files:
- - - [Config](functions/url-shortener/dev/common/config.ts)
- - - [Backend resources utilities](functions/url-shortener/dev/common/backend-resources-utils.ts)
- Preview of generator form and your generated urls
- Generation of short url record

---

## Project Setup

### Manual Setup

- Fork this repository
- Clone it locally
- Change project ID inisde [appwrite.json](appwrite.json) file to your project ID.
- While in root folder, run appwrite cli command `appwrite deploy function` and follow steps to deploy it
- - If you don't have appwrite cli installed, check [this link](https://appwrite.io/docs/tooling/command-line/installation) and install it on your device
- Once function is deployed, set environment variables to it:
- - DOMAIN
- - PROJECT_API_KEY

PROJECT-API-KEY is your api key from a project.  
DOMAIN is your custom domain you want your function to run on. If you do not have custom domain registered and set, set your appwrite-gived domain for that function.  
For example:
```
DOMAIN=624fbdf32f3aa04c42.appwrite.global
PROJECT_API_KEY=YOU API KEYWITH ALL PERMISSIONS
```

## Development

This project is developed with: 
- Typescript
- appwrite-node
- HTML, CSS and JS for template

Refer to [Package JSON](package.json) file

### How to start with development

- Locally, go to `functions/url-shortener` path.
- Run `npm install` command
- Start coding

**NOTE:** Make code adjustments only inside `dev` folder. Code inside `dev` folder will be built into `src` folder.

### How to deploy

- While inside `functions/url-shortener` path, run `nom run build` command after you made your desired code changes
- Go back to the root folder and run `appwrite deploy function` command. Follow the steps to deploy your function. 
- If needed, refer back to [Manual Setup section](#manual-setup)