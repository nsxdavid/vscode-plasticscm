export * from "./config";

import {
  ConfigurationChangeEvent,
  Event,
  EventEmitter,
  ExtensionContext,
  Uri,
  workspace,
  WorkspaceConfiguration } from "vscode";
import { extensionId } from "./constants";
import { IConfig } from "./config";

export class Configuration {

  private mOnDidChange = new EventEmitter<ConfigurationChangeEvent>();
  private mOnDidChangeAny = new EventEmitter<ConfigurationChangeEvent>();

  public get onDidChangeAny(): Event<ConfigurationChangeEvent> {
    return this.mOnDidChangeAny.event;
  }

  public get onDidChange(): Event<ConfigurationChangeEvent> {
    return this.mOnDidChange.event;
  }

  public static configureEvents(context: ExtensionContext): void {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(e => {
        configuration.mOnDidChangeAny.fire(e);
        if (e.affectsConfiguration(extensionId)) {
          configuration.mOnDidChange.fire(e);
        }
      }));
  }

  public get(): IConfig;
  public get<S1 extends keyof IConfig>(s1: S1, resource?: Uri | null, defaultValue?: IConfig[S1]): IConfig[S1];
  public get<S1 extends keyof IConfig, S2 extends keyof IConfig[S1]>(
    s1: S1,
    s2: S2,
    resource?: Uri | null,
    defaultValue?: IConfig[S1][S2],
  ): IConfig[S1][S2];

  // Keep adding overloads here if configuration nestiness keeps growing.
  public get<T>(...args: any[]): T | undefined {
    const section: string | undefined = Configuration.buildConfigKey(...args);
    const lastKeyIndex: number = Configuration.getLastConfigKeyIndex(...args);

    const resource: Uri | null | undefined = args[lastKeyIndex + 1];
    const defaultValue: T | undefined = args[lastKeyIndex + 2];

    const wkConfig: WorkspaceConfiguration =
      workspace.getConfiguration(
        section === undefined ? undefined : extensionId, resource);

    return defaultValue === undefined
      ? wkConfig.get<T>(section === undefined ? extensionId : section)
      : wkConfig.get<T>(section === undefined ? extensionId : section, defaultValue);
  }

  private static buildConfigKey(...args: any[]): string | undefined {
    if (args.length === 0 || typeof (args[0]) !== "string") {
      return undefined;
    }

    let result: string = args[0];
    let index: number;
    for (index = 1; index < args.length; index++) {
      if (typeof (args[index]) !== "string") {
        return result;
      }

      result += `.${args[index] as string}`;
    }

    return result;
  }

  private static getLastConfigKeyIndex(...args: any[]): number {
    for (let i = 0; i < args.length; i++) {
      if (typeof (args[i]) !== "string") {
        return i;
      }
    }

    return args.length;
  }
}

export const configuration = new Configuration();
