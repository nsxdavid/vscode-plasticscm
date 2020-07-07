import * as path from "path";
import { ChangeType, IChangeInfo } from "./models";
import { Command, SourceControlResourceDecorations, SourceControlResourceState, ThemeColor, Uri } from "vscode";
import { memoize } from "./decorators";

const iconsRootPath = path.join(__dirname, "..", "images", "icons");

function getIconPath(iconName: string, theme: string): Uri {
  return Uri.file(path.join(iconsRootPath, theme, `${iconName}.svg`));
}

interface IIcons {
  [theme: string]: IIconSet;
}

interface IIconSet {
  added: Uri;
  changed: Uri;
  checkedout: Uri;
  deleted: Uri;
  moved: Uri;
  private: Uri;
}

export class PlasticScmResource implements SourceControlResourceState {

  public command?: Command;

  private static icons: IIcons = {
    dark: {
      added: getIconPath("status-added", "dark"),
      changed: getIconPath("status-modified", "dark"),
      checkedout: getIconPath("status-modified", "dark"),
      deleted: getIconPath("status-deleted", "dark"),
      moved: getIconPath("status-renamed", "dark"),
      private: getIconPath("status-unversioned", "dark"),
    },
    light: {
      added: getIconPath("status-added", "light"),
      changed: getIconPath("status-modified", "light"),
      checkedout: getIconPath("status-modified", "light"),
      deleted: getIconPath("status-deleted", "light"),
      moved: getIconPath("status-renamed", "light"),
      private: getIconPath("status-unversioned", "light"),
    },
  };

  private mChangeInfo: IChangeInfo;

  public constructor(changeInfo: IChangeInfo) {
    this.mChangeInfo = changeInfo;
  }

  @memoize
  public get resourceUri(): Uri {
    return this.mChangeInfo.path;
  }

  public get decorations(): SourceControlResourceDecorations {
    return {
      dark: { iconPath: PlasticScmResource.getIconPath(this.mChangeInfo.type, "dark") },
      faded: false, // Maybe in the future for ignored items
      light: { iconPath: PlasticScmResource.getIconPath(this.mChangeInfo.type, "light") },
      strikeThrough: this.mChangeInfo.type === ChangeType.Deleted,
      tooltip: this.tooltip,
    };
  }

  public get letter(): string | undefined {
    const result: string[] = [];

    if (this.mChangeInfo.type & ChangeType.Private) {
      result.push("P");
    }

    if (this.mChangeInfo.type & ChangeType.Added) {
      result.push("A");
    }

    if (this.mChangeInfo.type & ChangeType.Changed) {
      result.push("C");
    }

    if (this.mChangeInfo.type & ChangeType.Moved) {
      result.push("M");
    }

    if (this.mChangeInfo.type & ChangeType.Checkedout) {
      result.push("C");
    }

    if (this.mChangeInfo.type & ChangeType.Deleted) {
      result.push("D");
    }

    return result.join("");
  }

  public get color(): ThemeColor | undefined {
    if (this.mChangeInfo.type & ChangeType.Private) {
      return new ThemeColor("gitDecoration.untrackedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Added) {
      return new ThemeColor("gitDecoration.addedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Changed) {
      return new ThemeColor("gitDecoration.modifiedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Moved) {
      return new ThemeColor("gitDecoration.modifiedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Checkedout) {
      return new ThemeColor("gitDecoration.modifiedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Deleted) {
      return new ThemeColor("gitDecoration.deletedResourceForeground");
    }

    return undefined;
  }

  private get tooltip(): string {
    if (this.mChangeInfo.type & ChangeType.Moved) {
      return `Moved from ${this.mChangeInfo.oldPath?.fsPath || ""}`;
    }

    if (this.mChangeInfo.type & ChangeType.Private) {
      return "Private";
    }

    if (this.mChangeInfo.type & ChangeType.Added) {
      return "Added";
    }

    if (this.mChangeInfo.type & ChangeType.Changed) {
      return "Changed";
    }

    if (this.mChangeInfo.type & ChangeType.Moved) {
      return "Moved";
    }

    if (this.mChangeInfo.type & ChangeType.Checkedout) {
      return "Checked Out";
    }

    if (this.mChangeInfo.type & ChangeType.Deleted) {
      return "Deleted";
    }

    return "Unknown";
  }

  private static getIconPath(changeType: ChangeType, theme: string): Uri {
    const icons = PlasticScmResource.icons[theme];
    if (!icons) {
      throw new Error(`Unknown theme: ${theme}`);
    }

    if (changeType & ChangeType.Private) {
      return icons.private;
    }

    if (changeType & ChangeType.Added) {
      return icons.added;
    }

    if (changeType & ChangeType.Changed) {
      return icons.changed;
    }

    if (changeType & ChangeType.Moved) {
      return icons.moved;
    }

    if (changeType & ChangeType.Checkedout) {
      return icons.checkedout;
    }

    if (changeType & ChangeType.Deleted) {
      return icons.deleted;
    }

    throw new Error(`Unknown ChangeType: ${changeType}`);
  }
}
