<h3 align="center">
  <br>
  <a href="https://github.com/HR/spacedrop"><img src="https://raw.githubusercontent.com/HR/spacedrop/master/build/icon.png" alt="Spacedrop" width="180" style= "margin-bottom: 1rem"></a>
  <br>
  Spacedrop Server
  <br>
  <br>
</h3>
<br>
<br>

Simple discovery and signalling (websocket) server for Spacedrop (https://github.com/HR/spacedrop), a P2P E2E encrypted file-sharing app.
Implements simple peer authentication. See `src/schema/message.json` for messaging format.


# Development
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

## Setup
Clone the repo
```
$ git clone https://github.com/HR/spacedrop-server.git
```

Install all libraries and tools
```
$ npm install
```

Create `.env.json` file with the required environmental variables
```json
{
  "REDIS_URI": "..."
}
```

## Run
To run it locally
```
$ gulp
```

The server should be running at `http://127.0.0.1:9000`
