import {
  Client,
  ClientApplication,
  ClientOptions,
  Team,
  User,
  Util,
} from 'discord.js'
import {
  CommandClientOptions,
  Registry,
  CommandHandler,
  BuiltInConverters,
} from '..'

/**
 * The command.ts client class.
 */
export class CommandClient extends Client {
  /**
   * Command/Listener Registry
   */
  registry = new Registry(this)
  /**
   * Command.TS Options
   */
  commandOptions: CommandClientOptions
  /**
   * Bot Owner List
   */
  owners: string[] = []

  /**
   * root path to load modules in relative path
   */
  rootPath: string

  /**
   * @param clientOptions Discord.js Client Options
   * @param rootPath Code Root Path
   * @param commandOptions Command.ts Options
   */
  constructor(
    clientOptions: ClientOptions,
    {
      rootPath,
      ...commandOptions
    }: Partial<CommandClientOptions> & {
      rootPath: string
    },
  ) {
    super(clientOptions)
    this.rootPath = rootPath
    this.commandOptions = Util.mergeDefault(
      {
        owners: commandOptions.owners || 'auto',
        prefix: commandOptions.prefix || '!',
        slashCommands: {
          autoRegister: false,
        },
        commands: {
          allowSelf: false,
          allowBots: false,
        },
      },
      commandOptions,
    ) as any
    this.registry.registerModule(new CommandHandler(this))
    this.registry.registerModule(new BuiltInConverters(this))
  }

  async login(token?: string): Promise<string> {
    const res = await super.login(token)
    if (this.commandOptions.owners === 'auto') {
      const app = this.application
      await app?.fetch()
      if (app) {
        if (app.owner instanceof Team) {
          this.owners = app.owner.members.map((x) => x.id)
        } else if (app.owner instanceof User) {
          this.owners = [app.owner.id]
        }
      }
    } else {
      this.owners = this.commandOptions.owners
    }
    await this.registry.slashCommandManager.refreshCommands()
    return res
  }
}
