const AbstractCommand = require(`./abstract-command`);
const LocalServer = require(`../server/local-server`);

const {Commands} = require(`../utils/util-constants`);
const colors = require(`colors`);

class Server extends AbstractCommand {
  execute(port) {
    const localServer = new LocalServer(port);
    localServer.start();
  }
}

module.exports = new Server(Commands.server,
    `Runs server at default port (3000)\n${colors.grey(`--server [PORT]`)} - ${colors.green(`Runs server at specified port`)}`);
