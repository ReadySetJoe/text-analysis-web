import type { NextApiRequest, NextApiResponse } from "next";

interface ShortcutAction {
  WFWorkflowActionIdentifier: string;
  WFWorkflowActionParameters?: Record<string, unknown>;
}

interface ShortcutConfig {
  WFWorkflowActions: ShortcutAction[];
  WFWorkflowName: string;
  WFWorkflowDescription: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer>
): void {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  // This creates the iOS Shortcut configuration
  const shortcutConfig: ShortcutConfig = {
    WFWorkflowActions: [
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.comment",
        WFWorkflowActionParameters: {
          WFCommentActionText:
            "Export Messages Shortcut - Extracts your text messages for analysis",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.ask.for.input",
        WFWorkflowActionParameters: {
          WFInputType: "Number",
          WFAskActionPrompt:
            "How many days back should we export? (e.g., 30 for last month)",
          WFAskActionDefaultAnswer: "30",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "DaysBack",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.date",
        WFWorkflowActionParameters: {
          WFDateActionMode: "Specified Date",
          WFDateActionDate: "Today",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.adjustdate",
        WFWorkflowActionParameters: {
          WFAdjustOperation: "Subtract",
          WFDuration: {
            Value: {
              WFVariableName: "DaysBack",
              WFSerializationType: "WFTextTokenAttachment",
            },
            WFSerializationType: "WFQuantityFieldValue",
          },
          WFAdjustDateUnit: "Days",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "StartDate",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.filter.messages",
        WFWorkflowActionParameters: {
          WFContentItemFilter: {
            Value: {
              WFActionParameterFilterPrefix: 1,
              WFContentPredicateBoundedDate: false,
              WFActionParameterFilterTemplates: [
                {
                  Property: "Date Sent",
                  Operator: 1003,
                  Values: {
                    WFVariableName: "StartDate",
                    WFSerializationType: "WFTextTokenAttachment",
                  },
                  Removable: true,
                },
              ],
            },
            WFSerializationType: "WFContentPredicateTableTemplate",
          },
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.repeat.each",
        WFWorkflowActionParameters: {
          WFControlFlowMode: 0,
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.properties.messages",
        WFWorkflowActionParameters: {
          WFContentItemPropertyName: "Content",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "MessageText",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.properties.messages",
        WFWorkflowActionParameters: {
          WFContentItemPropertyName: "Sender",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "Sender",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.properties.messages",
        WFWorkflowActionParameters: {
          WFContentItemPropertyName: "Date Sent",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.format.date",
        WFWorkflowActionParameters: {
          WFDateFormat: "ISO 8601",
          WFISO8601IncludeTime: true,
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "Timestamp",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.properties.messages",
        WFWorkflowActionParameters: {
          WFContentItemPropertyName: "Is from Me",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "IsFromMe",
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.dictionary",
        WFWorkflowActionParameters: {
          WFItems: {
            Value: {
              WFDictionaryFieldValueItems: [
                {
                  WFItemType: 0,
                  WFKey: {
                    Value: {
                      string: "text",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                  WFValue: {
                    Value: {
                      WFVariableName: "MessageText",
                      WFSerializationType: "WFTextTokenAttachment",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                },
                {
                  WFItemType: 0,
                  WFKey: {
                    Value: {
                      string: "sender",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                  WFValue: {
                    Value: {
                      WFVariableName: "Sender",
                      WFSerializationType: "WFTextTokenAttachment",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                },
                {
                  WFItemType: 0,
                  WFKey: {
                    Value: {
                      string: "timestamp",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                  WFValue: {
                    Value: {
                      WFVariableName: "Timestamp",
                      WFSerializationType: "WFTextTokenAttachment",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                },
                {
                  WFItemType: 3,
                  WFKey: {
                    Value: {
                      string: "isFromMe",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                  WFValue: {
                    Value: {
                      WFVariableName: "IsFromMe",
                      WFSerializationType: "WFTextTokenAttachment",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                },
              ],
            },
            WFSerializationType: "WFDictionaryFieldValue",
          },
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.addtolist",
        WFWorkflowActionParameters: {},
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.repeat.each",
        WFWorkflowActionParameters: {
          WFControlFlowMode: 2,
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.dictionary",
        WFWorkflowActionParameters: {
          WFItems: {
            Value: {
              WFDictionaryFieldValueItems: [
                {
                  WFItemType: 4,
                  WFKey: {
                    Value: {
                      string: "messages",
                    },
                    WFSerializationType: "WFTextTokenString",
                  },
                  WFValue: {
                    Value: {
                      OutputUUID: "previous-action-uuid",
                      WFSerializationType: "WFTextTokenAttachment",
                    },
                    WFSerializationType: "WFArrayParameterState",
                  },
                },
              ],
            },
            WFSerializationType: "WFDictionaryFieldValue",
          },
        },
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.format.json",
        WFWorkflowActionParameters: {},
      },
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.documentpicker.save",
        WFWorkflowActionParameters: {
          WFFileDestination: "Files",
          WFAskWhereToSave: false,
          WFSaveDestination: "Shortcuts",
        },
      },
    ],
    WFWorkflowName: "Export Messages for Analysis",
    WFWorkflowDescription: "Exports your text messages as JSON for analysis",
  };

  // Set headers for .shortcut file download
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Export-Messages.shortcut"'
  );

  // Convert to binary format that iOS Shortcuts expects
  const shortcutData = JSON.stringify(shortcutConfig);
  const buffer = Buffer.from(shortcutData, "utf8");

  res.status(200).send(buffer);
}
