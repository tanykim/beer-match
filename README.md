# Beer Match

Beer Match is a web-based visualization project powered by data from Untapped (http://untappd.com). This code includes both server-side (based on NodeJS) and client-side. Beer Match is not affiliated or endorsed by Untapped.

## Version
0.0.1

## API credentials
First obtain Untapped credentials here: https://untappd.com/api/register?register=new

## Set-up
#### 1. Install packages
You need to install necessary packages

```
$ sudo npm install
```

#### 2. Change API credentials
Open settings.local enter the Untapped credentials you've obtianed earlier.

```
{
	"clientId": "<client id>",
	"clientSecret": "<client secret>"
}
```
Then save it as a JSON file.

```
$ cp settings.local settings.json
```

#### 3. Create a CSS file

> Less is needed. If you don't have Less installed yet, please install this first:

```
$ sudo npm install -g less
```
Then

```
$ lessc less/style.less public/style/style.css
```

#### 4. Install browser-side libraries

> Bower is needed. If you don't have Bower installed yet, please install this first:

```
$ sudo npm install -g bower
```
Then go to the public folder and install necessary libraries.

```
$ cd public
$ bower install d3 moment-timezone moment underscore jquery chroma-js textures
```

## Start the server
> Beer Match works on Forever installed globally. If you don't have Forever installed yet and wish to install locally, do this first:

```
$ sudo npm install forever
```

Then go to the main folder

```
$ cd ..
$ forever start app.js
```

If you want to stop the server, do

```
$ forever stop 0
```

Test on your browser.
> http://localhost:8080
