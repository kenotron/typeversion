declare const CommandSource: {
  readonly AcceptSharedChannelInvitationDialog: "this_is_modified";
  readonly AccessibilitySettingsPanelButton: "AccessibilitySettingsPanelButton";
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
