declare const CommandSource: {
  readonly AcceptSharedChannelInvitationDialog: "AcceptSharedChannelInvtationDialog";
  readonly AccessibilitySettingsPanelButton: "AccessibilitySettingsPanelButton";
  readonly AccountSelectionDialog: "AccountSelectionDialog";
  readonly ActivityFeed: "ActivityFeed";
  readonly ActivityFeedBellClick: "ActivityFeedBellClick";
  readonly AcceptInvitationFromAccountAndSettingPage: "AcceptInvitationFromAccountAndSettingPage";
  readonly AdaptiveCardInvokeButton: "AdaptiveCardInvokeButton";
  readonly AddAccountFromButton: "AddAccountFromButton";
  readonly AddAccountFromMeMenu: "AddAccountFromMeMenu";
  readonly AddAccountFromSettings: "AddAccountFromSettings";
  readonly AddCloudStorageFolderDialog: "AddCloudStorageFolderDialog";
};

type CommandSource = (typeof CommandSource)[keyof typeof CommandSource];

type EntityCommandInput = {
  entityCommand: {
    correlation: {
      id: string;
      source: CommandSource;
      startTimestamp: number;
    };
  };
};

export type IComplexType = {
  authenticationUser?: {
    /**
     *  The email/phone number the user has logged-in with.
     */
    loginUserName: string | null;
  };
  entityCommanding: {
    chat: {
      chatById: (id: string, options: EntityCommandInput) => void;
    };
    contacts: {
      openContactsSyncModal: () => void;
    };
  };
};
