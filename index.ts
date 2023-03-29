import Discord, { ApplicationCommandOptionType, ApplicationCommandType, Client, Collection, CommandInteraction, InteractionResponse } from "discord.js";
import { Configuration, OpenAIApi } from "openai";

type CommandArgs = {
    client: ExtendClient;
    interaction: CommandInteraction;
}

interface ICommand {
    config: {
        name: string;
        description: string;
        options?: {
            name: string;
            description: string;
            choise?: object[];
            type: ApplicationCommandOptionType.String;
            required: boolean;
        }[];
    };
    execute: ({ client, interaction }: CommandArgs) => Promise<void | InteractionResponse> | void | InteractionResponse;
}

const commands: ICommand[] = [
    {
        config: {
            name: "ai",
            description: "¯\\_(ツ)_/¯",
            options: [
                {
                    name: "content",
                    description: "enter your question",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        execute: ({ interaction }) => {
            interaction.deferReply({ ephemeral: false });
            const content = interaction.options.get("content")?.value;

            openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                max_tokens: 1000,
                n: 1,
                messages: [{
                    role: "user",
                    content: `${content}`
                }]
            }).then(async res => {
                try {
                    const result = res.data.choices[0].message?.content;
                    interaction.editReply({ content: result });
                } catch (e) {
                    console.error(e);
                    interaction.editReply({ content: "An error occurred!" })
                }
            }).catch(e => {
                console.error(e.response.data);
                interaction.editReply({ content: "An error occurred!" })
            })
        }
    },
    {
        config: {
            name: "create",
            description: "¯\\_(ツ)_/¯",
            options: [
                {
                    name: "content",
                    description: "enter your question",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        execute: ({ interaction }) => {
            interaction.deferReply({ ephemeral: true });
            const content = interaction.options.get("content")?.value;

            openai.createImage({
                prompt: `${content}`,
                size: "512x512",
                response_format: "url"
            }).then(res => {
                try {
                    const embed = new Discord.EmbedBuilder()
                        .setImage(res.data.data[0].url || "")
                        .setColor('Random')
                        .setFooter({
                            text: `Requested by ${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL()
                        })
                        .setTimestamp()
                    interaction.editReply({ embeds: [embed] });
                } catch (e) {
                    console.error(e);
                    interaction.editReply({ content: "An error occurred!" })
                }
            }).catch(e => {
                console.error(e);
                interaction.editReply({ content: "An error occurred!" })
            })
        }
    }
]

class ExtendClient extends Client {
    commands = new Collection<string, ICommand>();
}

const config = new Configuration({
    apiKey: process.env.OPENAI_KEY
})
const openai = new OpenAIApi(config)
const client = new ExtendClient({
    intents: ["MessageContent", "Guilds", "GuildMessages", "GuildMessageTyping", "DirectMessages"]
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.username}`);

    loadCommands();
    registerSlashCommands();

    client.on("interactionCreate", interaction => {
        if (interaction.isCommand() && interaction.channel?.id == process.env.CHANNEL_ID) {
            const command: ICommand | undefined = client.commands.get(interaction.command?.name || "");
            command?.execute({ client, interaction });
        }
    })
})

client.login(process.env.TOKEN);

function loadCommands() {
    client.commands.set(commands[0].config.name, commands[0]);
    client.commands.set(commands[1].config.name, commands[1]);
}

function registerSlashCommands() {
    const allConfig = commands.map(e => { return e.config });

    (async () => {
        try {
            await client.application?.commands.set(allConfig);
            console.log(`Successfully load bot commands!`);
        } catch (e) {
            console.log(e)
        }
    })()
}