const eris = require('eris');
const azdev = require("azure-devops-node-api");
import * as dotenv from 'dotenv'
import * as wi from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import * as ints from "azure-devops-node-api/interfaces/common/VSSInterfaces"


//CONNECTION
dotenv.config()
const PREFIX = '!';

const bot = new eris.Client(process.env.ERISKEY);

async function createWI(data: string): Promise<wi.WorkItem> {
  let orgUrl = "https://dev.azure.com/" + process.env.ORGNAME;
  let token = process.env.AZUREPAT;
  let authHandler = azdev.getPersonalAccessTokenHandler(token);
  let connection = new azdev.WebApi(orgUrl, authHandler);

  let wii = await connection.getWorkItemTrackingApi();
  let wijson: ints.JsonPatchDocument = [{ "op": "add", "path": "/fields/System.Title", "value": data }];
  let project: string = "knoxgates";
  let witype: string = "Task";
  let cWI: wi.WorkItem = await wii.createWorkItem(null, wijson, project, witype);
  return cWI
}
bot.on('ready', () => {
  console.log('Connected and ready.');
});

//create modular functions as keys in object
type commandHandlerForCommandNameType = { [key: string]: any };
const commandHandlerForCommandName: commandHandlerForCommandNameType = {};
// IDEA - Create work item when !idea <message> is typed
commandHandlerForCommandName.idea = async (msg: any, args: string[]) => {
  const words: string = args.join(" ")
  let resp: wi.WorkItem = await createWI(words)
  return msg.channel.createMessage(`created WI number ${resp.id?.toString()},
URL is located at ${resp._links.html.href}`);
};

//trigger upon user posting message in discord
bot.on('messageCreate', async (msg: any) => {
  const content = msg.content;
  console.log(`content is ${content}`)

  if (!msg.channel.guild) {
    return;
  }

  if (!content.startsWith(PREFIX)) {
    console.log(`Started with wrong prefix ${content}`)
    return;
  }

  //parse which function (key) to call in object along with params
  const parts: any = content.split(' ').map((s: any) => s.trim()).filter((s: any) => s);
  const commandName: string = parts[0].substring(PREFIX.length);
  const args: any = parts.slice(1);
  const commandHandler = commandHandlerForCommandName[commandName];
  if (!commandHandler) {
    return;
  }

  //call it
  try {
    await commandHandler(msg, args);
  } catch (err) {
    console.warn('Error handling command');
    console.warn(err);
  }
});

bot.on('error', (err: Error) => {
  console.warn(err);
});

bot.connect();