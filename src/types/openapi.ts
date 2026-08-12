type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
type OneOf<T extends any[]> = T extends [infer Only] ? Only : T extends [infer A, infer B, ...infer Rest] ? OneOf<[XOR<A, B>, ...Rest]> : never;

export interface paths {
  "/Tools/bookkeepingSystemVersion": {
    get: operations["bookkeepingSystemVersion"];
  };
  "/CheckAccount": {
    get: operations["getCheckAccounts"];
  };
  "/CheckAccount/Factory/fileImportAccount": {
    post: operations["createFileImportAccount"];
  };
  "/CheckAccount/Factory/clearingAccount": {
    post: operations["createClearingAccount"];
  };
  "/CheckAccount/{checkAccountId}": {
    get: operations["getCheckAccountById"];
    put: operations["updateCheckAccount"];
    delete: operations["deleteCheckAccount"];
  };
  "/CheckAccount/{checkAccountId}/getBalanceAtDate": {
    get: operations["getBalanceAtDate"];
  };
  "/CheckAccountTransaction": {
    get: operations["getTransactions"];
    post: operations["createTransaction"];
  };
  "/CheckAccountTransaction/{checkAccountTransactionId}": {
    get: operations["getCheckAccountTransactionById"];
    put: operations["updateCheckAccountTransaction"];
    delete: operations["deleteCheckAccountTransaction"];
  };
  "/CheckAccountTransaction/{checkAccountTransactionId}/enshrine": {
    put: operations["checkAccountTransactionEnshrine"];
  };
  "/PrivateTransactionRule": {
    get: operations["listPrivateTransactionRules"];
    post: operations["createPrivateTransactionRule"];
  };
  "/PrivateTransactionRule/{id}": {
    delete: operations["deletePrivateTransactionRule"];
  };
  "/Contact/Factory/getNextCustomerNumber": {
    get: operations["getNextCustomerNumber"];
  };
  "/Contact/Factory/findContactsByCustomFieldValue": {
    get: operations["findContactsByCustomFieldValue"];
  };
  "/Contact/Mapper/checkCustomerNumberAvailability": {
    get: operations["contactCustomerNumberAvailabilityCheck"];
  };
  "/Contact": {
    get: operations["getContacts"];
    post: operations["createContact"];
  };
  "/Contact/{contactId}": {
    get: operations["getContactById"];
    put: operations["updateContact"];
    delete: operations["deleteContact"];
  };
  "/Contact/{contactId}/getTabsItemCount": {
    get: operations["getContactTabsItemCountById"];
  };
  "/ContactAddress": {
    get: operations["getContactAddresses"];
    post: operations["createContactAddress"];
  };
  "/ContactAddress/{contactAddressId}": {
    get: operations["getContactAddressById"];
    put: operations["updateContactAddress"];
    delete: operations["deleteContactAddress"];
  };
  "/CommunicationWay": {
    get: operations["getCommunicationWays"];
    post: operations["createCommunicationWay"];
  };
  "/CommunicationWay/{communicationWayId}": {
    get: operations["getCommunicationWayById"];
    put: operations["UpdateCommunicationWay"];
    delete: operations["deleteCommunicationWay"];
  };
  "/CommunicationWayKey": {
    get: operations["getCommunicationWayKeys"];
  };
  "/AccountingContact": {
    get: operations["getAccountingContact"];
    post: operations["createAccountingContact"];
  };
  "/AccountingContact/{accountingContactId}": {
    get: operations["getAccountingContactById"];
    put: operations["updateAccountingContact"];
    delete: operations["deleteAccountingContact"];
  };
  "/Textparser/fetchDictionaryEntriesByType": {
    get: operations["getPlaceholder"];
  };
  "/ContactCustomField": {
    get: operations["getContactFields"];
    post: operations["createContactField"];
  };
  "/ContactCustomField/{contactCustomFieldId}": {
    get: operations["getContactFieldsById"];
    put: operations["updateContactfield"];
    delete: operations["deleteContactCustomFieldId"];
  };
  "/ContactCustomFieldSetting": {
    get: operations["getContactFieldSettings"];
    post: operations["createContactFieldSetting"];
  };
  "/ContactCustomFieldSetting/{contactCustomFieldSettingId}": {
    get: operations["getContactFieldSettingById"];
    put: operations["updateContactFieldSetting"];
    delete: operations["deleteContactFieldSetting"];
  };
  "/ContactCustomFieldSetting/{contactCustomFieldSettingId}/getReferenceCount": {
    get: operations["getReferenceCount"];
  };
  "/CreditNote": {
    get: operations["getCreditNotes"];
  };
  "/CreditNote/Factory/saveCreditNote": {
    post: operations["createcreditNote"];
  };
  "/CreditNote/Factory/createFromInvoice": {
    post: operations["createCreditNoteFromInvoice"];
  };
  "/CreditNote/Factory/createFromVoucher": {
    post: operations["createCreditNoteFromVoucher"];
  };
  "/CreditNote/{creditNoteId}": {
    get: operations["getcreditNoteById"];
    put: operations["updatecreditNote"];
    delete: operations["deletecreditNote"];
  };
  "/CreditNote/{creditNoteId}/sendByWithRender": {
    get: operations["sendCreditNoteByPrinting"];
  };
  "/CreditNote/{creditNoteId}/sendBy": {
    put: operations["creditNoteSendBy"];
  };
  "/CreditNote/{creditNoteId}/enshrine": {
    put: operations["creditNoteEnshrine"];
  };
  "/CreditNote/{creditNoteId}/getPdf": {
    get: operations["creditNoteGetPdf"];
  };
  "/CreditNote/{creditNoteId}/sendViaEmail": {
    post: operations["sendCreditNoteViaEMail"];
  };
  "/CreditNote/{creditNoteId}/bookAmount": {
    put: operations["bookCreditNote"];
  };
  "/CreditNote/{creditNoteId}/resetToOpen": {
    put: operations["creditNoteResetToOpen"];
  };
  "/CreditNote/{creditNoteId}/resetToDraft": {
    put: operations["creditNoteResetToDraft"];
  };
  "/CreditNotePos": {
    get: operations["getcreditNotePositions"];
  };
  "/SevClient/{SevClientId}/updateExportConfig": {
    put: operations["updateExportConfig"];
  };
  "/Export/datevCSV": {
    get: operations["exportDatevDepricated"];
  };
  "/Export/createDatevCsvZipExportJob": {
    get: operations["exportDatevCSV"];
  };
  "/Export/createDatevXmlZipExportJob": {
    get: operations["exportDatevXML"];
  };
  "/Progress/generateDownloadHash": {
    get: operations["generateDownloadHash"];
  };
  "/Progress/getProgress": {
    get: operations["getProgress"];
  };
  "/ExportJob/jobDownloadInfo": {
    get: operations["jobDownloadInfo"];
  };
  "/Export/invoiceCsv": {
    get: operations["exportInvoice"];
  };
  "/Export/invoiceZip": {
    get: operations["exportInvoiceZip"];
  };
  "/Export/creditNoteCsv": {
    get: operations["exportCreditNote"];
  };
  "/Export/voucherListCsv": {
    get: operations["exportVoucher"];
  };
  "/Export/transactionsCsv": {
    get: operations["exportTransactions"];
  };
  "/Export/voucherZip": {
    get: operations["exportVoucherZip"];
  };
  "/Export/contactListCsv": {
    get: operations["exportContact"];
  };
  "/Part": {
    get: operations["getParts"];
    post: operations["createPart"];
  };
  "/Part/{partId}": {
    get: operations["getPartById"];
    put: operations["updatePart"];
  };
  "/Part/{partId}/getStock": {
    get: operations["partGetStock"];
  };
  "/Invoice": {
    get: operations["getInvoices"];
  };
  "/Invoice/Factory/saveInvoice": {
    post: operations["createInvoiceByFactory"];
  };
  "/Invoice/{invoiceId}": {
    get: operations["getInvoiceById"];
    put: operations["updateInvoiceById"];
    delete: operations["deleteInvoiceById"];
  };
  "/Invoice/{invoiceId}/getPositions": {
    get: operations["getInvoicePositionsById"];
  };
  "/Invoice/Factory/createInvoiceFromOrder": {
    post: operations["createInvoiceFromOrder"];
  };
  "/Invoice/Factory/createInvoiceReminder": {
    post: operations["createInvoiceReminder"];
  };
  "/Invoice/{invoiceId}/getIsPartiallyPaid": {
    get: operations["getIsInvoicePartiallyPaid"];
  };
  "/Invoice/{invoiceId}/cancelInvoice": {
    post: operations["cancelInvoice"];
  };
  "/Invoice/{invoiceId}/render": {
    post: operations["invoiceRender"];
  };
  "/Invoice/{invoiceId}/sendViaEmail": {
    post: operations["sendInvoiceViaEMail"];
  };
  "/Invoice/{invoiceId}/getPdf": {
    get: operations["invoiceGetPdf"];
  };
  "/Invoice/{invoiceId}/getXml": {
    get: operations["invoiceGetXml"];
  };
  "/Invoice/{invoiceId}/sendBy": {
    put: operations["invoiceSendBy"];
  };
  "/Invoice/{invoiceId}/enshrine": {
    put: operations["invoiceEnshrine"];
  };
  "/Invoice/{invoiceId}/bookAmount": {
    put: operations["bookInvoice"];
  };
  "/Invoice/{invoiceId}/resetToOpen": {
    put: operations["invoiceResetToOpen"];
  };
  "/Invoice/{invoiceId}/resetToDraft": {
    put: operations["invoiceResetToDraft"];
  };
  "/InvoicePos": {
    get: operations["getInvoicePos"];
  };
  "/DocServer/getLetterpapersWithThumb": {
    get: operations["getLetterpapersWithThumb"];
  };
  "/DocServer/getTemplatesWithThumb": {
    get: operations["getTemplates"];
  };
  "/Invoice/{invoiceId}/changeParameter": {
    put: operations["updateInvoiceTemplate"];
  };
  "/Order/{orderId}/changeParameter": {
    put: operations["updateOrderTemplate"];
  };
  "/CreditNote/{creditNoteId}/changeParameter": {
    put: operations["updateCreditNoteTemplate"];
  };
  "/Order": {
    get: operations["getOrders"];
  };
  "/Order/Factory/saveOrder": {
    post: operations["createOrder"];
  };
  "/Order/{orderId}": {
    get: operations["getOrderById"];
    put: operations["updateOrder"];
    delete: operations["deleteOrder"];
  };
  "/Order/{orderId}/getPositions": {
    get: operations["getOrderPositionsById"];
  };
  "/Order/{orderId}/getDiscounts": {
    get: operations["getDiscounts"];
  };
  "/Order/{orderId}/getRelatedObjects": {
    get: operations["getRelatedObjects"];
  };
  "/Order/{orderId}/sendViaEmail": {
    post: operations["sendorderViaEMail"];
  };
  "/Order/Factory/createPackingListFromOrder": {
    post: operations["createPackingListFromOrder"];
  };
  "/Order/Factory/createContractNoteFromOrder": {
    post: operations["createContractNoteFromOrder"];
  };
  "/Order/{orderId}/getPdf": {
    get: operations["orderGetPdf"];
  };
  "/Order/{orderId}/sendBy": {
    put: operations["orderSendBy"];
  };
  "/OrderPos": {
    get: operations["getOrderPositions"];
  };
  "/OrderPos/{orderPosId}": {
    get: operations["getOrderPositionById"];
    put: operations["updateOrderPosition"];
    delete: operations["deleteOrderPos"];
  };
  "/Voucher/Factory/saveVoucher": {
    post: operations["voucherFactorySaveVoucher"];
  };
  "/Voucher/Factory/uploadTempFile": {
    post: operations["voucherUploadFile"];
  };
  "/Voucher": {
    get: operations["getVouchers"];
  };
  "/Voucher/{voucherId}": {
    get: operations["getVoucherById"];
    put: operations["updateVoucher"];
  };
  "/Voucher/{voucherId}/enshrine": {
    put: operations["voucherEnshrine"];
  };
  "/Voucher/{voucherId}/bookAmount": {
    put: operations["bookVoucher"];
  };
  "/Voucher/{voucherId}/resetToOpen": {
    put: operations["voucherResetToOpen"];
  };
  "/Voucher/{voucherId}/resetToDraft": {
    put: operations["voucherResetToDraft"];
  };
  "/VoucherPos": {
    get: operations["getVoucherPositions"];
  };
  "/ReceiptGuidance/forAllAccounts": {
    get: operations["forAllAccounts"];
  };
  "/ReceiptGuidance/forAccountNumber": {
    get: operations["forAccountNumber"];
  };
  "/ReceiptGuidance/forTaxRule": {
    get: operations["forTaxRule"];
  };
  "/ReceiptGuidance/forRevenue": {
    get: operations["forRevenue"];
  };
  "/ReceiptGuidance/forExpense": {
    get: operations["forExpense"];
  };
  "/Report/invoicelist": {
    get: operations["reportInvoice"];
  };
  "/Report/orderlist": {
    get: operations["reportOrder"];
  };
  "/Report/contactlist": {
    get: operations["reportContact"];
  };
  "/Report/voucherlist": {
    get: operations["reportVoucher"];
  };
  "/Tag": {
    get: operations["getTags"];
  };
  "/Tag/{tagId}": {
    get: operations["getTagById"];
    put: operations["updateTag"];
    delete: operations["deleteTag"];
  };
  "/Tag/Factory/create": {
    post: operations["createTag"];
  };
  "/TagRelation": {
    get: operations["getTagRelations"];
  };
  "/Document": {
    get: operations["getDocuments"];
  };
  "/Invoice/{invoiceId}/changeStatus": {
    put: operations["updateStatus"];
  };
  "/Invoice/{invoiceId}/getLastDunning": {
    get: operations["getLastDunning"];
  };
  "/Invoice/Factory/getOpenInvoiceReminderDebit": {
    get: operations["getOpenInvoiceReminderDebit"];
  };
  "/SevUser": {
    get: operations["getSevUsers"];
  };
  "/SevUser/{sevUserId}": {
    get: operations["getSevUserById"];
  };
  "/TextTemplate": {
    get: operations["getTextTemplate"];
    post: operations["addTextTemplate"];
  };
  "/TextTemplate/{id}": {
    put: operations["updateTextTemplate"];
    delete: operations["deleteTextTemplate"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    Model_CheckAccountResponse: {
      id?: string;
      objectName?: "CheckAccount";
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      name?: string;
      iban?: string | null;
      type?: "online" | "offline" | "register";
      importType?: "CSV" | "MT940" | null;
      currency?: string;
      defaultAccount?: string;
      baseAccount?: string;
      priority?: string;
      status?: "0" | "100";
      balance?: string | null;
      bankServer?: string | null;
      autoMapTransactions?: string | null;
      autoSyncTransactions?: string;
      lastSync?: string;
      accountingNumber?: string;
      bic?: string | null;
    };
    createFileImportAccount: {
      name: string;
      importType: "CSV" | "MT940";
      accountingNumber?: number | null;
      iban?: string | null;
    };
    createFileImportAccountResponse: {
      id?: string;
      objectName?: string;
      create?: string;
      update?: string;
      sevClient?: {
        id: string;
        objectName: string;
      };
      name?: string;
      iban?: string | null;
      type?: "online" | "offline";
      importType?: "CSV" | "MT940";
      currency?: string;
      defaultAccount?: "0" | "1";
      status?: "0" | "100";
      autoMapTransactions?: "0" | "1";
      accountingNumber?: string;
    };
    createClearingAccount: {
      name: string;
      accountingNumber?: number | null;
    };
    createClearingAccountResponse: {
      id?: string;
      objectName?: string;
      create?: string;
      update?: string;
      sevClient?: {
        id: string;
        objectName: string;
      };
      name?: string;
      type?: "online" | "offline";
      currency?: string;
      defaultAccount?: "0" | "1";
      status?: "0" | "100";
      accountingNumber?: string;
    };
    Model_CheckAccountUpdate: {
      name?: string;
      defaultAccount?: 0 | 1;
      autoMapTransactions?: number | null;
      accountingNumber?: string;
      iban?: string;
      bic?: string;
    };
    Model_CheckAccountTransactionResponse: {
      id?: string;
      objectName?: "CheckAccountTransaction";
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      valueDate?: string;
      entryDate?: string | null;
      paymtPurpose?: string | null;
      amount?: number;
      payeePayerName?: string | null;
      payeePayerAcctNo?: string | null;
      payeePayerBankCode?: string | null;
      gvCode?: string | null;
      entryText?: string | null;
      primaNotaNo?: string | null;
      checkAccount?: {
        readonly id: string;
        readonly objectName: "CheckAccount";
      };
      status?: "100" | "200" | "300" | "350" | "400";
      sourceTransaction?: {
        readonly id: string;
        readonly objectName: "CheckAccountTransaction";
      };
      targetTransaction?: {
        readonly id: string;
        readonly objectName: "CheckAccountTransaction";
      };
      enshrined?: string;
    };
    Model_CheckAccountTransaction: {
      id?: number;
      objectName?: "CheckAccountTransaction";
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      valueDate: string;
      entryDate?: string | null;
      paymtPurpose?: string | null;
      amount: number;
      payeePayerName: string | null;
      payeePayerAcctNo?: string | null;
      payeePayerBankCode?: string | null;
      checkAccount: {
        id: number;
        objectName: "CheckAccount";
      };
      status: 100 | 200 | 300 | 400;
      sourceTransaction?: {
        id: number;
        objectName: "CheckAccountTransaction";
      } | null;
      targetTransaction?: {
        id: number;
        objectName: "CheckAccountTransaction";
      } | null;
    };
    Model_CheckAccountTransactionUpdate: {
      valueDate?: string;
      entryDate?: string | null;
      paymtPurpose?: string;
      amount?: number | null;
      payeePayerName?: string | null;
      checkAccount?: {
        id: number;
        objectName: "CheckAccount";
      };
      status?: 100 | 200 | 300 | 400;
      sourceTransaction?: {
        id: number;
        objectName: "CheckAccountTransaction";
      } | null;
      targetTransaction?: {
        id: number;
        objectName: "CheckAccountTransaction";
      } | null;
    };
    validationError: {
      error?: {
        message?: string;
        exceptionUUID?: string;
      };
    };
    Model_PrivateTransactionRuleResponse: {
      id?: string;
      objectName?: string;
      create?: string;
      update?: string;
      sevClient?: {
        id?: string;
        objectName?: string;
      };
      paymentPurpose?: string | null;
      counterpartName?: string | null;
    };
    CreatePrivateTransactionRule: {
      objectName: string;
      paymentPurpose?: string | null;
      counterpartName?: string | null;
    };
    Model_ContactResponse: {
      id?: string;
      objectName?: "Contact";
      create?: string;
      update?: string;
      name?: string;
      status?: string;
      customerNumber?: string;
      parent?: {
        readonly id: string;
        readonly objectName: "Contact";
      };
      surename?: string;
      familyname?: string;
      titel?: string;
      category?: {
        readonly id: string;
        readonly objectName: "Category";
      };
      description?: string;
      academicTitle?: string;
      gender?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      name2?: string;
      birthday?: string;
      vatNumber?: string;
      bankAccount?: string;
      bankNumber?: string;
      defaultCashbackTime?: string;
      defaultCashbackPercent?: string;
      defaultTimeToPay?: string;
      taxNumber?: string;
      taxOffice?: string;
      exemptVat?: string;
      defaultDiscountAmount?: number;
      defaultDiscountPercentage?: string;
      buyerReference?: string;
      governmentAgency?: string;
      additionalInformation?: string;
      addresses?: (components["schemas"]["Model_ContactAddress"] | ({
          id: number;
          objectName: "ContactAddress";
        } | null))[];
      communicationWays?: (components["schemas"]["Model_CommunicationWay"] | ({
          id: string;
          objectName: "CommunicationWay";
        } | null))[];
      mainAddress?: components["schemas"]["Model_ContactAddress"];
      taxSet?: {
        readonly id: string;
        readonly objectName: "TaxSet";
      };
      taxType?: "custom" | "default" | "eu" | "noteu" | "ss";
    };
    Model_Contact: {
      name?: string | null;
      status?: number | null;
      customerNumber?: string | null;
      parent?: components["schemas"]["Model_Contact"] | ({
        id: number;
        objectName: "Contact";
      } | null);
      surename?: string | null;
      familyname?: string | null;
      titel?: string | null;
      category: {
        id: number;
        objectName: "Category";
      };
      description?: string | null;
      academicTitle?: string | null;
      gender?: string | null;
      name2?: string | null;
      birthday?: string | null;
      vatNumber?: string | null;
      bankAccount?: string | null;
      bankNumber?: string | null;
      defaultCashbackTime?: number | null;
      defaultCashbackPercent?: number | null;
      defaultTimeToPay?: number | null;
      taxNumber?: string | null;
      taxOffice?: string | null;
      exemptVat?: boolean | null;
      defaultDiscountAmount?: number | null;
      defaultDiscountPercentage?: boolean | null;
      buyerReference?: string | null;
      governmentAgency?: boolean | null;
      addresses?: (components["schemas"]["Model_ContactAddress"] | ({
          id: number;
          objectName: "ContactAddress";
        } | null))[];
      communicationWays?: (components["schemas"]["Model_CommunicationWay"] | ({
          id: string;
          objectName: "CommunicationWay";
        } | null))[];
      mainAddress?: components["schemas"]["Model_ContactAddress"];
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxType?: "custom" | "default" | "eu" | "noteu" | "ss" | null;
    };
    Model_ContactUpdate: {
      name?: string | null;
      status?: number | null;
      customerNumber?: string | null;
      parent?: {
        id: number;
        objectName: "Contact";
      } | null;
      surename?: string | null;
      familyname?: string | null;
      titel?: string | null;
      category?: {
        id: number;
        objectName: "Category";
      } | null;
      description?: string | null;
      academicTitle?: string | null;
      gender?: string | null;
      name2?: string | null;
      birthday?: string | null;
      vatNumber?: string | null;
      bankAccount?: string | null;
      bankNumber?: string | null;
      defaultCashbackTime?: number | null;
      defaultCashbackPercent?: number | null;
      defaultTimeToPay?: number | null;
      taxNumber?: string | null;
      taxOffice?: string | null;
      exemptVat?: boolean | null;
      defaultDiscountAmount?: number | null;
      defaultDiscountPercentage?: boolean | null;
      buyerReference?: string | null;
      governmentAgency?: boolean | null;
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxType?: "custom" | "default" | "eu" | "noteu" | "ss" | null;
    };
    Model_ContactAddressResponse: {
      id?: number;
      objectName?: "ContactAddress";
      create?: string;
      update?: string;
      contact: components["schemas"]["Model_Contact"] | {
        id: number;
        objectName: "Contact";
      };
      street?: string | null;
      zip?: string | null;
      city?: string | null;
      country: components["schemas"]["Model_StaticCountryResponse"] | {
        id: number;
        objectName: "StaticCountry";
      };
      category?: {
        id: number;
        objectName: "Category";
      } | null;
      name?: string | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      name2?: string;
      name3?: string | null;
      name4?: string | null;
    };
    Model_ContactAddress: {
      id?: number;
      objectName?: "ContactAddress";
      create?: string;
      update?: string;
      contact: components["schemas"]["Model_Contact"] | {
        id: number;
        objectName: "Contact";
      };
      street?: string | null;
      zip?: string | null;
      city?: string | null;
      country: components["schemas"]["Model_StaticCountryResponse"] | {
        id: number;
        objectName: "StaticCountry";
      };
      category: {
        id: number;
        objectName: "Category";
      } | null;
      name?: string | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      name2?: string;
      name3?: string | null;
      name4?: string | null;
    };
    Model_ContactAddressUpdate: {
      contact?: {
        id: number;
        objectName: "Contact";
      } | null;
      street?: string | null;
      zip?: string | null;
      city?: string | null;
      country?: {
        id: number;
        objectName: "StaticCountry";
      } | null;
      category?: {
        id: number;
        objectName: "Category";
      } | null;
      name?: string | null;
      name2?: string;
      name3?: string | null;
      name4?: string | null;
    };
    Model_CommunicationWayResponse: {
      id?: string;
      objectName?: "CommunicationWay";
      create?: string;
      update?: string;
      contact?: components["schemas"]["Model_Contact"] | {
        readonly id: string;
        readonly objectName: "Contact";
      };
      type?: "EMAIL" | "PHONE" | "WEB" | "MOBILE" | "FAX";
      value?: string;
      key?: {
        readonly id: string;
        readonly objectName: "CommunicationWayKey";
      };
      main?: string;
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
    };
    Model_CommunicationWay: {
      id?: number;
      objectName?: "CommunicationWay";
      create?: string;
      update?: string;
      contact?: {
        id: number;
        objectName: "Contact";
      };
      type: "EMAIL" | "PHONE" | "WEB" | "MOBILE" | "FAX";
      value: string;
      key: {
        id: number;
        objectName: "CommunicationWayKey";
      };
      main?: boolean | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
    };
    Model_CommunicationWayUpdate: {
      contact?: {
        id: number;
        objectName: "Contact";
      } | null;
      type?: "EMAIL" | "PHONE" | "WEB" | "MOBILE" | "FAX";
      value?: string;
      key?: {
        id: number;
        objectName: "CommunicationWayKey";
      } | null;
      main?: boolean | null;
    };
    Model_AccountingContactResponse: {
      id?: string;
      objectName?: "AccountingContact";
      create?: string;
      update?: string;
      contact?: {
        readonly id: string;
        readonly objectName: "Contact";
      };
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      debitorNumber?: string;
      creditorNumber?: string;
    };
    Model_AccountingContact: {
      contact: {
        id: number;
        objectName: "Contact";
      };
      debitorNumber?: number | null;
      creditorNumber?: number | null;
    };
    Model_AccountingContactUpdate: {
      contact?: {
        id: number;
        objectName: "Contact";
      } | null;
      debitorNumber?: number | null;
      creditorNumber?: number | null;
    };
    Model_Textparser_fetchDictionaryEntriesByType_response: {
      key?: string;
      value?: {
          key?: string;
          value?: string;
        }[];
    };
    Model_ContactCustomFieldSettingResponse: {
      id?: string;
      objectName?: "ContactCustomFieldSetting";
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      name?: string;
      identifier?: string;
      description?: string;
    };
    Model_ContactCustomFieldResponse: {
      id?: string;
      objectName?: "ContactCustomField";
      create?: string;
      update?: string;
      sevClient?: {
        id: string;
        objectName: "SevClient";
      };
      contact?: {
        id: string;
        objectName: "Contact";
      };
      contactCustomFieldSetting?: components["schemas"]["Model_ContactCustomFieldSettingResponse"];
      value?: string;
    };
    Model_ContactCustomField: {
      contact: {
        id: number;
        objectName: "Contact";
      };
      contactCustomFieldSetting: {
        id: number;
        objectName: "ContactCustomFieldSetting";
      };
      value: string;
      objectName: "ContactCustomField";
    };
    Model_ContactCustomFieldUpdate: {
      contact?: {
        id: number;
        objectName: "Contact";
      };
      contactCustomFieldSetting?: {
        id: number;
        objectName: "ContactCustomFieldSetting";
      };
      value?: string;
      objectName?: "ContactCustomField";
    };
    Model_ContactCustomFieldSetting: {
      name: string;
      description?: string;
      objectName?: "ContactCustomFieldSetting";
    };
    Model_ContactCustomFieldSettingUpdate: {
      name?: string;
      description?: string;
      objectName?: "ContactCustomFieldSetting";
    };
    Model_creditNoteResponse: {
      id?: string;
      objectName?: "CreditNote";
      create?: string;
      update?: string;
      creditNoteNumber?: string | null;
      contact?: {
        id: string;
        objectName: "Contact";
      } | null;
      creditNoteDate?: string;
      status?: "100" | "200" | "750" | "1000";
      header?: string | null;
      headText?: string | null;
      footText?: string | null;
      addressCountry?: {
        id: string;
        objectName: "StaticCountry";
      } | null;
      createUser?: {
        readonly id: string;
        readonly objectName: "SevUser";
      };
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      deliveryDate?: string;
      smallSettlement?: boolean | null;
      contactPerson?: {
        id: string;
        objectName: "SevUser";
      } | null;
      taxRate?: string | null;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxSet?: {
        id: string;
        objectName: "TaxSet";
      } | null;
      taxText?: string | null;
      taxType?: string | null;
      sendDate?: string | null;
      address?: string | null;
      currency?: string | null;
      sumNet?: string;
      sumTax?: string;
      sumGross?: string;
      sumDiscounts?: string;
      sumNetForeignCurrency?: string;
      sumTaxForeignCurrency?: string;
      sumGrossForeignCurrency?: string;
      sumDiscountsForeignCurrency?: string;
      customerInternalNote?: string | null;
      showNet?: boolean;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | "" | 0 | null;
      creditNoteType?: string | null;
    };
    Model_creditNote: {
      id?: number;
      objectName: "CreditNote";
      mapAll: boolean;
      create?: string;
      update?: string;
      creditNoteNumber: string;
      contact: {
        id: number;
        objectName: "Contact";
      };
      creditNoteDate: string;
      status: "100" | "200" | "300" | "500" | "750" | "1000";
      header: string;
      headText?: string | null;
      footText?: string | null;
      addressCountry: {
        id: number;
        objectName: "StaticCountry";
      } | null;
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      smallSettlement?: boolean | null;
      contactPerson: {
        id: number;
        objectName: "SevUser";
      };
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
      taxRate: number;
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxText: string;
      taxType: string;
      sendDate?: string | null;
      address?: string | null;
      bookingCategory?: "PROVISION" | "ROYALTY_ASSIGNED" | "ROYALTY_UNASSIGNED" | "UNDERACHIEVEMENT" | "ACCOUNTING_TYPE" | null;
      currency: string;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumDiscounts?: number;
      sumNetForeignCurrency?: number;
      sumTaxForeignCurrency?: number;
      sumGrossForeignCurrency?: number;
      sumDiscountsForeignCurrency?: number;
      customerInternalNote?: string | null;
      showNet?: boolean;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
      creditNoteType?: string;
    };
    Model_creditNotePos: {
      id?: number | null;
      objectName: "CreditNotePos";
      mapAll: boolean;
      create?: string;
      update?: string;
      creditNote?: {
        id: number;
        objectName: "CreditNote";
      };
      part?: {
        id: number;
        objectName: "Part";
      };
      quantity: number;
      price?: number | null;
      priceNet?: number | null;
      priceTax?: number | null;
      priceGross?: number | null;
      name?: string | null;
      unity: {
        id: number;
        objectName: "Unity";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      positionNumber?: number | null;
      text?: string | null;
      discount?: number | null;
      optional?: boolean | null;
      taxRate: number;
      sumDiscount?: number | null;
    };
    saveCreditNote: {
      creditNote: components["schemas"]["Factory_creditNote"];
      creditNotePosSave: components["schemas"]["Model_creditNotePos"][];
      creditNotePosDelete: {
        id: number;
        objectName: "CreditNotePos";
      } | null;
      discountSave: {
        discount: boolean;
        text: string;
        percentage: boolean;
        value: number;
        objectName: "Discounts";
        mapAll: boolean;
      } | null;
      discountDelete: {
        id: number;
        objectName: "Discounts";
      } | null;
      takeDefaultAddress: boolean;
      forCashRegister: boolean;
    };
    Model_creditNotePosResponse: {
      id?: string;
      objectName?: "CreditNotePos";
      create?: string;
      update?: string;
      creditNote: {
        id: string;
        objectName: "CreditNote";
      };
      part?: {
        id: string;
        objectName: "Part";
      };
      quantity: string;
      price?: string | null;
      priceNet?: string | null;
      priceTax?: string | null;
      priceGross?: string | null;
      name?: string | null;
      unity: {
        id: string;
        objectName: "Unity";
      };
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      positionNumber?: string | null;
      text?: string | null;
      discount?: string | null;
      optional?: boolean | null;
      taxRate: string;
      sumDiscount?: string | null;
    };
    saveCreditNoteResponse: {
      creditNote?: components["schemas"]["Model_creditNoteResponse"];
      creditNotePos?: components["schemas"]["Model_creditNotePosResponse"][];
    };
    Model_discountsResponse: {
      id?: number;
      objectName?: "Discounts";
      create?: string;
      update?: string;
      sevClient?: string;
      discount?: string;
      text?: string;
      percentage?: string;
      value?: string;
      isNet?: string;
    };
    Model_creditNoteUpdate: {
      id?: number;
      objectName?: "CreditNote";
      create?: string;
      update?: string;
      creditNoteNumber?: string | null;
      contact?: {
        id: number;
        objectName: "Contact";
      } | null;
      creditNoteDate?: string;
      status?: "100" | "200" | "750" | "1000";
      header?: string | null;
      headText?: string | null;
      footText?: string | null;
      addressCountry?: {
        id: number;
        objectName: "StaticCountry";
      } | null;
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      deliveryDate?: string;
      smallSettlement?: boolean | null;
      contactPerson?: {
        id: number;
        objectName: "SevUser";
      } | null;
      taxRate?: number | null;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxText?: string | null;
      taxType?: string | null;
      sendDate?: string | null;
      address?: string | null;
      currency?: string | null;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumDiscounts?: number;
      sumNetForeignCurrency?: number;
      sumTaxForeignCurrency?: number;
      sumGrossForeignCurrency?: number;
      sumDiscountsForeignCurrency?: number;
      customerInternalNote?: string | null;
      showNet?: boolean;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
      creditNoteType?: string | null;
    };
    Model_CreditNote_sendByWithRender: OneOf<[{
      pdf?: string;
    }, {
      pages?: number;
      thumbs?: unknown[];
    }]> & {
      docId?: string;
      parameters?: {
          key?: string;
          name?: string;
          value?: string;
          values?: {
              name?: string;
              translationCade?: string;
              value?: string;
            }[];
          visible?: boolean;
        }[];
    };
    Model_creditNote_mailResponse: {
      id?: number;
      objectName?: "Email";
      additionalInformation?: string;
      create?: string;
      update?: string;
      object?: components["schemas"]["Model_creditNoteResponse"];
      from?: string;
      to?: string;
      subject?: string;
      text?: string;
      sevClient?: {
        id: number;
        objectName: "SevClient";
      };
    };
    Export_Progress_Data: {
      current?: number;
      total?: number;
    };
    Export_Job_Download_Info: {
      filename?: string;
      link?: string;
      linkExpireDate?: string;
    };
    Model_Part: {
      id?: number;
      objectName?: "Part";
      create?: string;
      update?: string;
      name: string;
      partNumber: string;
      text?: string | null;
      category?: {
        id: number;
        objectName: "Category";
      } | null;
      stock: number;
      stockEnabled?: boolean;
      unity: {
        id: number;
        objectName: "Unity";
      };
      price?: number | null;
      priceNet?: number | null;
      priceGross?: number | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      pricePurchase?: number | null;
      taxRate: number;
      status?: 50 | 100 | null;
      internalComment?: string | null;
    };
    Model_PartUpdate: {
      id?: number | null;
      objectName?: "Part" | null;
      create?: string;
      update?: string;
      name?: string;
      partNumber?: string;
      text?: string | null;
      category?: {
        id: number;
        objectName: "Category";
      } | null;
      stock?: number;
      stockEnabled?: boolean | null;
      unity?: {
        id: number;
        objectName: "Unity";
      };
      price?: number | null;
      priceNet?: number | null;
      priceGross?: number | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      pricePurchase?: number | null;
      taxRate?: number;
      status?: 50 | 100 | null;
      internalComment?: string | null;
    };
    Model_InvoiceResponse: {
      id?: string;
      objectName?: "Invoice";
      invoiceNumber?: string;
      contact?: components["schemas"]["Model_ContactResponse"];
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      invoiceDate?: string;
      header?: string;
      headText?: string;
      footText?: string;
      timeToPay?: string;
      discountTime?: string;
      discount?: string;
      addressCountry?: components["schemas"]["Model_StaticCountryResponse"];
      payDate?: string;
      createUser?: {
        readonly id: string;
        readonly objectName: "SevUser";
      };
      deliveryDate?: string;
      status?: "50" | "100" | "200" | "750" | "1000" | "500";
      smallSettlement?: boolean;
      contactPerson?: {
        readonly id: string;
        readonly objectName: "SevUser";
      };
      taxRate?: string;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxText?: string;
      dunningLevel?: string;
      taxType?: "default" | "eu" | "noteu" | "custom" | "ss";
      paymentMethod?: components["schemas"]["Model_PaymentMethodResponse"];
      costCentre?: {
        readonly id: string;
        readonly objectName: "CostCentre";
      };
      sendDate?: string;
      origin?: ({
        readonly id: number;
        readonly objectName: "Invoice" | "Order";
      }) | null;
      invoiceType?: "RE" | "WKR" | "SR" | "MA" | "TR" | "AR" | "ER";
      accountIntervall?: string;
      accountNextInvoice?: string;
      reminderTotal?: string;
      reminderDebit?: string;
      reminderDeadline?: string;
      reminderCharge?: string;
      taxSet?: {
        readonly id: string;
        readonly objectName: "TaxSet";
      };
      address?: string;
      currency?: string;
      sumNet?: string;
      sumTax?: string;
      sumGross?: string;
      sumDiscounts?: string;
      sumNetForeignCurrency?: string;
      sumTaxForeignCurrency?: string;
      sumGrossForeignCurrency?: string;
      sumDiscountsForeignCurrency?: string;
      sumNetAccounting?: string;
      sumTaxAccounting?: string;
      sumGrossAccounting?: string;
      paidAmount?: number;
      customerInternalNote?: string;
      showNet?: boolean;
      enshrined?: string;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | "" | 0 | null;
      deliveryDateUntil?: string;
      datevConnectOnline?: Record<string, never>;
      sendPaymentReceivedNotificationDate?: string;
      checkAccountTransactionLogs?: readonly components["schemas"]["Model_CheckAccountTransactionLogResponse"][];
      checkAccountTransactions?: readonly components["schemas"]["Model_CheckAccountTransactionResponse"][];
      debit?: number;
      tags?: readonly components["schemas"]["Model_TagResponse"][];
      total?: string;
    };
    Model_Invoice: {
      id?: number | null;
      objectName?: "Invoice";
      invoiceNumber?: string | null;
      contact: {
        id: number;
        objectName: "Contact";
      };
      contactPerson: {
        id: number;
        objectName: "SevUser";
      };
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      invoiceDate: string;
      header?: string | null;
      headText?: string | null;
      footText?: string | null;
      timeToPay?: number | null;
      discount: number;
      address?: string | null;
      addressCountry: {
        id: number;
        objectName: "StaticCountry";
      };
      payDate?: string | null;
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      deliveryDate?: string | null;
      deliveryDateUntil?: number | null;
      status: "50" | "100" | "200" | "750" | "1000" | "500";
      smallSettlement?: boolean | null;
      taxRate: number;
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
      taxText: string;
      taxType: "default" | "eu" | "noteu" | "custom" | "ss";
      taxSet?: {
        id: string;
        objectName: "TaxSet";
      } | null;
      dunningLevel?: number | null;
      paymentMethod?: {
        id: number;
        objectName: "PaymentMethod";
      };
      sendDate?: string | null;
      invoiceType: "RE" | "WKR" | "SR" | "MA" | "TR" | "AR" | "ER";
      accountIntervall?: string | null;
      accountNextInvoice?: number | null;
      currency: string;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumDiscounts?: number;
      sumNetForeignCurrency?: number;
      sumTaxForeignCurrency?: number;
      sumGrossForeignCurrency?: number;
      sumDiscountsForeignCurrency?: number;
      sumNetAccounting?: number;
      sumTaxAccounting?: number;
      sumGrossAccounting?: number;
      paidAmount?: number | null;
      showNet?: boolean;
      enshrined?: string;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
      origin?: {
        id: string;
        objectName: "Order";
      } | null;
      customerInternalNote?: string | null;
      propertyIsEInvoice?: boolean | null;
      mapAll: boolean;
    };
    Model_InvoicePos: {
      id?: number;
      objectName: "InvoicePos";
      mapAll: boolean;
      create?: string;
      update?: string;
      invoice?: {
        readonly id: number;
        readonly objectName: "Invoice";
      };
      part?: {
        id: number;
        objectName: "Part";
      };
      quantity: number;
      price?: number | null;
      name?: string | null;
      unity: {
        id: number;
        objectName: "Unity";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      positionNumber?: number | null;
      text?: string | null;
      discount?: number | null;
      taxRate: number;
      sumDiscount?: number | null;
      sumNetAccounting?: number | null;
      sumTaxAccounting?: number | null;
      sumGrossAccounting?: number | null;
      priceNet?: number | null;
      priceGross?: number | null;
      priceTax?: number | null;
    };
    saveInvoice: {
      invoice: components["schemas"]["Factory_Invoice"];
      invoicePosSave: components["schemas"]["Model_InvoicePos"][];
      invoicePosDelete: {
        id: number;
        objectName: "InvoicePos";
      } | null;
      filename?: string;
      discountSave: {
          discount?: boolean;
          text?: string;
          percentage?: boolean;
          value?: number;
          objectName?: "Discounts";
          mapAll?: boolean;
        }[] | null;
      discountDelete: {
        id?: number;
        objectName?: "Discounts";
      } | null;
      takeDefaultAddress: boolean;
    };
    Model_InvoicePosResponse: {
      id?: string;
      objectName?: "InvoicePos";
      create?: string;
      update?: string;
      invoice?: {
        readonly id: string;
        readonly objectName: "Invoice";
      };
      part?: {
        readonly id: string;
        readonly objectName: "Part";
      };
      quantity?: string;
      price?: string;
      name?: string;
      unity?: {
        readonly id: string;
        readonly objectName: "Unity";
      };
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      positionNumber?: string;
      text?: string;
      discount?: string;
      taxRate?: string;
      sumDiscount?: string;
      sumNetAccounting?: string;
      sumTaxAccounting?: string;
      sumGrossAccounting?: string;
      priceNet?: string;
      priceGross?: string;
      priceTax?: string;
    };
    saveInvoiceResponse: {
      invoice?: components["schemas"]["Model_InvoiceResponse"];
      invoicePos?: components["schemas"]["Model_InvoicePosResponse"][];
      filename?: string;
    };
    Model_CreateInvoiceFromOrder: {
      order: {
        id: number;
        objectName: "Order";
      };
      type?: "percentage" | "net" | "gross" | null;
      amount?: number | null;
      partialType?: "RE" | "TR" | "AR" | null;
    };
    Model_Email: {
      id?: number;
      objectName?: "Email";
      create?: string;
      update?: string;
      object?: components["schemas"]["Model_InvoiceResponse"];
      from: string;
      to: string;
      subject: string;
      text?: string | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      cc?: string | null;
      bcc?: string | null;
      arrived?: string | null;
    };
    Model_ChangeLayout: {
      key: "language" | "template" | "letterpaper" | "payPal";
      value: string;
    };
    Model_ChangeLayoutResponse: {
      result?: string;
      metadaten?: OneOf<[{
        pdf?: string;
      }, {
        pages?: number;
        thumbs?: unknown[];
      }]> & {
        docId?: string;
        parameters?: {
            key?: string;
            name?: string;
            values?: {
                name?: string;
                translationCode?: string;
                value?: string;
              }[];
          }[];
      };
    };
    Model_OrderResponse: {
      id?: string;
      objectName?: "Order";
      create?: string;
      update?: string;
      orderNumber?: string;
      contact?: {
        id: string;
        objectName: "Contact";
      };
      orderDate?: string;
      status?: "100" | "200" | "300" | "500" | "750" | "1000";
      header?: string;
      headText?: string | null;
      footText?: string | null;
      addressCountry?: {
        id: string;
        objectName: "StaticCountry";
      } | null;
      createUser?: {
        readonly id: string;
        readonly objectName: "SevUser";
      };
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      deliveryTerms?: string | null;
      paymentTerms?: string | null;
      origin?: {
        id: string;
        objectName: "Order";
      } | null;
      version?: string;
      smallSettlement?: boolean;
      contactPerson?: {
        id: string;
        objectName: "SevUser";
      };
      taxRate?: string;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxSet?: {
        id: string;
        objectName: "TaxSet";
      } | null;
      taxText?: string;
      taxType?: string;
      orderType?: "AN" | "AB" | "LI";
      sendDate?: string | null;
      address?: string | null;
      currency?: string;
      sumNet?: string;
      sumTax?: string;
      sumGross?: string;
      sumDiscounts?: string;
      sumNetForeignCurrency?: string;
      sumTaxForeignCurrency?: string;
      sumGrossForeignCurrency?: string;
      sumDiscountsForeignCurrency?: string;
      customerInternalNote?: string | null;
      showNet?: boolean;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | "" | 0 | null;
    };
    Model_Order: {
      id?: number;
      objectName?: "Order";
      mapAll: boolean;
      create?: string;
      update?: string;
      orderNumber: string;
      contact: {
        id: number;
        objectName: "Contact";
      };
      orderDate: string;
      status: 100 | 200 | 300 | 500 | 750 | 1000;
      header: string;
      headText?: string | null;
      footText?: string | null;
      addressCountry: {
        id: number;
        objectName: "StaticCountry";
      };
      deliveryTerms?: string | null;
      paymentTerms?: string | null;
      version: number;
      smallSettlement?: boolean;
      contactPerson: {
        id: number;
        objectName: "SevUser";
      };
      taxRate: number;
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxText: string;
      taxType: string;
      orderType?: "AN" | "AB" | "LI";
      sendDate?: string | null;
      address?: string | null;
      currency: string;
      customerInternalNote?: string | null;
      showNet?: boolean;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
      origin?: {
        id: number;
        objectName: "Order";
      } | null;
    };
    Model_OrderPos: {
      id?: number;
      objectName?: "OrderPos";
      create?: string;
      update?: string;
      order?: {
        id: number;
        objectName: "Order";
      };
      part?: {
        id: number;
        objectName: "Part";
      };
      quantity: number;
      price?: number | null;
      priceNet?: number | null;
      priceTax?: number | null;
      priceGross?: number | null;
      name?: string | null;
      unity: {
        id: number;
        objectName: "Unity";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      positionNumber?: number | null;
      text?: string | null;
      discount?: number | null;
      optional?: boolean | null;
      taxRate: number;
      sumDiscount?: number | null;
    };
    saveOrder: {
      order: components["schemas"]["Factory_Order"];
      orderPosSave: components["schemas"]["Model_OrderPos"][];
      orderPosDelete?: {
        id: number;
        objectName: "OrderPos";
      };
    };
    Model_OrderPosResponse: {
      id?: string;
      objectName?: "OrderPos";
      create?: string;
      update?: string;
      order?: {
        id: string;
        objectName: "Order";
      };
      part?: {
        id: string;
        objectName: "Part";
      };
      quantity?: string;
      price?: string | null;
      priceNet?: string | null;
      priceTax?: string | null;
      priceGross?: string | null;
      name?: string | null;
      unity?: {
        id: string;
        objectName: "Unity";
      };
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      positionNumber?: string | null;
      text?: string | null;
      discount?: string | null;
      optional?: boolean | null;
      taxRate?: string;
      sumDiscount?: string | null;
    };
    saveOrderResponse: {
      order?: components["schemas"]["Model_OrderResponse"];
      orderPos?: components["schemas"]["Model_OrderPosResponse"][];
    };
    Model_OrderUpdate: {
      id?: number;
      objectName?: "Order";
      create?: string;
      update?: string;
      orderNumber?: string;
      contact?: {
        id: number;
        objectName: "Contact";
      } | null;
      orderDate?: string | null;
      status?: 100 | 200 | 300 | 500 | 750 | 1000 | null;
      header?: string | null;
      headText?: string | null;
      footText?: string | null;
      addressCountry?: {
        id: number;
        objectName: "StaticCountry";
      } | null;
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      deliveryTerms?: string | null;
      paymentTerms?: string | null;
      origin?: {
        id: number;
        objectName: "Order";
      } | null;
      version?: number | null;
      smallSettlement?: boolean | null;
      contactPerson?: {
        id: number;
        objectName: "SevUser";
      };
      taxRate?: number | null;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxText?: string | null;
      taxType?: string | null;
      orderType?: "AN" | "AB" | "LI" | null;
      sendDate?: string | null;
      address?: string | null;
      currency?: string | null;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumDiscounts?: number;
      sumNetForeignCurrency?: number;
      sumTaxForeignCurrency?: number;
      sumGrossForeignCurrency?: number;
      sumDiscountsForeignCurrency?: number;
      customerInternalNote?: string | null;
      showNet?: boolean | null;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
    };
    Model_Discount: {
      id?: string;
      objectName?: "Discounts";
      create?: string;
      update?: string;
      object?: {
        readonly id: string;
        readonly objectName: "Order";
      };
      sevClient?: string;
      text?: string;
      percentage?: string;
      value?: string;
      isNet?: string;
    };
    Model_EmailOrder: {
      id?: number;
      objectName?: "Email";
      create?: string;
      update?: string;
      object?: components["schemas"]["Model_OrderResponse"];
      from: string;
      to: string;
      subject: string;
      text?: string | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      cc?: string | null;
      bcc?: string | null;
      arrived?: string | null;
    };
    Model_CreatePackingListFromOrder: {
      id: number;
      objectName: "Order";
    };
    Model_OrderPosUpdate: {
      id?: number;
      objectName?: "OrderPos";
      create?: string;
      update?: string;
      order?: {
        id: number;
        objectName: "Order";
      };
      part?: {
        id: number;
        objectName: "Part";
      };
      quantity?: number | null;
      price?: number | null;
      priceNet?: number | null;
      priceTax?: number | null;
      priceGross?: number | null;
      name?: string | null;
      unity?: {
        id: number;
        objectName: "Unity";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      positionNumber?: number | null;
      text?: string | null;
      discount?: number | null;
      optional?: boolean | null;
      taxRate?: number | null;
      sumDiscount?: number | null;
    };
    Model_Voucher: {
      id?: number;
      objectName: "Voucher";
      mapAll: boolean;
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      voucherDate?: string | null;
      supplier?: {
        id: number;
        objectName: "Contact";
      } | null;
      supplierName?: string | null;
      description?: string | null;
      payDate?: string | null;
      status: 50 | 100 | 1000;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumNetAccounting?: number;
      sumTaxAccounting?: number;
      sumGrossAccounting?: number;
      sumDiscounts?: number;
      sumDiscountsForeignCurrency?: number;
      paidAmount?: number | null;
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
      taxType: string;
      creditDebit: "C" | "D";
      voucherType: "VOU" | "RV";
      currency?: string | null;
      propertyForeignCurrencyDeadline?: string | null;
      propertyExchangeRate?: number | null;
      recurringInterval?: string | null;
      recurringStartDate?: string | null;
      recurringNextVoucher?: string | null;
      recurringLastVoucher?: string | null;
      recurringEndDate?: string | null;
      enshrined?: string;
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      paymentDeadline?: string | null;
      deliveryDate?: string;
      deliveryDateUntil?: string | null;
      document?: {
        id: number;
        objectName: "Document";
      } | null;
      costCentre?: {
        id: number;
        objectName: "CostCentre";
      };
    };
    Model_VoucherPos: {
      id?: number;
      objectName: "VoucherPos";
      mapAll: boolean;
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      voucher: {
        readonly id: number;
        readonly objectName: "Voucher";
      };
      accountDatev: {
        id: number;
        objectName: "AccountDatev";
      };
      accountingType: {
        id: number;
        objectName: string;
      };
      estimatedAccountingType?: {
        readonly id: number;
        readonly objectName: "AccountingType";
      };
      taxRate: number;
      net: boolean;
      isAsset?: boolean;
      sumNet: number;
      sumTax?: number;
      sumGross: number;
      sumNetAccounting?: number;
      sumTaxAccounting?: number;
      sumGrossAccounting?: number;
      comment?: string | null;
    };
    saveVoucher: {
      voucher: components["schemas"]["Factory_Voucher"];
      voucherPosSave: components["schemas"]["Factory_VoucherPos"][];
      voucherPosDelete: {
        id: number;
        objectName: "VoucherPos";
      } | null;
      filename?: string;
    };
    Model_VoucherResponse: {
      id?: string;
      objectName?: "Voucher";
      mapAll?: boolean;
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      createUser?: {
        readonly id: string;
        readonly objectName: "SevUser";
      };
      voucherDate?: string | null;
      supplier?: {
        id: string;
        objectName: "Contact";
      } | null;
      supplierName?: string | null;
      description?: string | null;
      document?: {
        id: string;
        objectName: "Document";
      } | null;
      payDate?: string | null;
      status?: "50" | "100" | "1000" | "150" | "750" | null;
      sumNet?: string;
      sumTax?: string;
      sumGross?: string;
      sumNetAccounting?: string;
      sumTaxAccounting?: string;
      sumGrossAccounting?: string;
      sumDiscounts?: string;
      sumDiscountsForeignCurrency?: string;
      paidAmount?: number | null;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxType?: string | null;
      creditDebit?: "C" | "D" | null;
      costCentre?: {
        id: string;
        objectName: "CostCentre";
      };
      voucherType?: "VOU" | "RV" | null;
      currency?: string | null;
      propertyForeignCurrencyDeadline?: string | null;
      propertyExchangeRate?: string | null;
      recurringInterval?: string | null;
      recurringStartDate?: string | null;
      recurringNextVoucher?: string | null;
      recurringLastVoucher?: string | null;
      recurringEndDate?: string | null;
      enshrined?: string;
      taxSet?: {
        id: string;
        objectName: "TaxSet";
      } | null;
      paymentDeadline?: string | null;
      deliveryDate?: string;
      deliveryDateUntil?: string | null;
    };
    Model_VoucherPosResponse: {
      id?: string;
      objectName?: "VoucherPos";
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      voucher: {
        readonly id: string;
        readonly objectName: "Voucher";
      };
      accountDatev: {
        id: number;
        objectName: string;
      };
      accountingType: {
        id: string;
        objectName: "AccountingType";
      };
      estimatedAccountingType?: {
        readonly id: string;
        readonly objectName: "AccountingType";
      };
      taxRate: string;
      net: boolean;
      isAsset?: boolean;
      sumNet: string;
      sumTax?: string;
      sumGross: string;
      sumNetAccounting?: string;
      sumTaxAccounting?: string;
      sumGrossAccounting?: string;
      comment?: string | null;
    };
    saveVoucherResponse: {
      voucher?: components["schemas"]["Model_VoucherResponse"];
      voucherPos?: components["schemas"]["Model_VoucherPosResponse"][];
      filename?: string;
    };
    Model_VoucherUpdate: {
      voucherDate?: string | null;
      supplier?: {
        id: number;
        objectName: "Contact";
      } | null;
      supplierName?: string | null;
      description?: string | null;
      payDate?: string | null;
      status?: 50 | 100 | 1000;
      paidAmount?: number | null;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxType?: string;
      creditDebit?: "C" | "D";
      voucherType?: "VOU" | "RV";
      currency?: string | null;
      propertyForeignCurrencyDeadline?: string | null;
      propertyExchangeRate?: number | null;
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      paymentDeadline?: string | null;
      deliveryDate?: string;
      deliveryDateUntil?: string | null;
      document?: {
        id: number;
        objectName: "Document";
      } | null;
      costCentre?: {
        id: number;
        objectName: "CostCentre";
      };
    };
    ReceiptGuideDto: {
      accountDatevId?: number;
      accountNumber?: string;
      accountName?: string;
      description?: string;
      allowedTaxRules?: {
          name?: string;
          description?: string;
          id?: number;
          taxRates?: string[];
        }[];
      allowedReceiptTypes?: string[];
    };
    Model_TagResponse: {
      id?: string;
      objectName?: "Tag";
      additionalInformation?: string;
      create?: string;
      name?: string;
      sevClient?: {
        id: string;
        objectName: "SevClient";
      };
    };
    Model_TagCreateResponse: {
      id?: string;
      objectName?: "TagRelation";
      additionalInformation?: string;
      create?: string;
      tag?: {
        id: string;
        objectName: "Tag";
      };
      object?: {
        id: number;
        objectName: "Invoice" | "Voucher" | "Order" | "CreditNote";
      };
      sevClient?: {
        id: string;
        objectName: "SevClient";
      };
    };
    Model_CheckAccountTransactionLogResponse: {
      additionalInformation?: string;
      amountPaid?: number;
      bookingDate?: string;
      checkAccountTransaction?: components["schemas"]["Model_CheckAccountTransactionResponse"];
      create?: string;
      fromStatus?: "100" | "200" | "300" | "350" | "400";
      id?: string;
      object?: {
        readonly id: string;
        readonly objectName: "Invoice" | "Voucher";
      };
      objectName?: "CheckAccountTransactionLog";
      sevClient?: {
        readonly id: string;
        readonly objectName: "SevClient";
      };
      toStatus?: "100" | "200" | "300" | "350" | "400";
    };
    Model_DocumentResponse: {
      additionalInformation?: string;
      baseObject?: {
        readonly id: string;
        readonly objectName: "CreditNote" | "Invoice" | "Order";
      };
      contentHash?: string;
      create?: string;
      createUser?: {
        readonly id: string;
        readonly objectName: "SevUser";
      };
      description?: string;
      documentNumber?: string;
      extension?: string;
      filename?: string;
      filesize?: number;
      folder?: {
        readonly id: string;
        readonly objectName: "DocumentFolder";
      };
      id?: string;
      mimeType?: string;
      object?: {
        readonly id: number;
        readonly objectName: "Contact";
      };
      objectName?: "Document";
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      status?: string;
      update?: string;
      updateUser?: {
        readonly id: string;
        readonly objectName: "SevUser";
      };
    };
    Model_InvoicePosUpdate: {
      create?: string;
      discount?: number | null;
      id?: number;
      invoice?: {
        id: number;
        objectName: "Invoice";
      } | null;
      name?: string | null;
      objectName?: "InvoicePos";
      part?: {
        id: number;
        objectName: "Part";
      };
      positionNumber?: number | null;
      price?: number | null;
      priceGross?: number | null;
      priceNet?: number | null;
      priceTax?: number | null;
      quantity?: number | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      sumDiscount?: number | null;
      sumGrossAccounting?: number | null;
      sumNetAccounting?: number | null;
      sumTaxAccounting?: number | null;
      taxRate?: number | null;
      text?: string | null;
      unity?: {
        id: number;
        objectName: "Unity";
      };
      update?: string;
    };
    Model_InvoiceUpdate: {
      accountIntervall?: string | null;
      accountNextInvoice?: number | null;
      address?: string | null;
      addressCountry?: {
        id: number;
        objectName: "StaticCountry";
      } | null;
      contact?: {
        id: number;
        objectName: "Contact";
      } | null;
      contactPerson?: {
        id: number;
        objectName: "SevUser";
      };
      costCentre?: {
        id: number;
        objectName: "CostCentre";
      };
      create?: string;
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      currency?: string | null;
      customerInternalNote?: string | null;
      datevConnectOnline?: Record<string, unknown> | null;
      deliveryDate?: string | null;
      deliveryDateUntil?: number | null;
      discount?: number | null;
      discountTime?: number | null;
      dunningLevel?: number | null;
      enshrined?: string | null;
      footText?: string | null;
      header?: string | null;
      headText?: string | null;
      id?: number;
      invoiceDate?: string | null;
      invoiceNumber?: string | null;
      invoiceType?: "AR" | "ER" | "MA" | "RE" | "SR" | "TR" | "WKR" | null;
      objectName?: "Invoice";
      origin?: {
        id: number;
        objectName: "Order";
      } | null;
      paidAmount?: number | null;
      payDate?: string | null;
      paymentMethod?: {
        id: number;
        objectName: "PaymentMethod";
      };
      reminderCharge?: number | null;
      reminderDeadline?: number | null;
      reminderDebit?: number | null;
      reminderTotal?: number | null;
      sendDate?: string | null;
      sendPaymentReceivedNotificationDate?: number | null;
      sendType?: "VM" | "VP" | "VPDF" | "VPR" | null;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      showNet?: boolean | null;
      smallSettlement?: boolean | null;
      status?: "100" | "1000" | "200" | "50" | "750" | null;
      sumDiscounts?: number | null;
      sumDiscountsForeignCurrency?: number | null;
      sumGross?: number | null;
      sumGrossAccounting?: number | null;
      sumGrossForeignCurrency?: number | null;
      sumNet?: number | null;
      sumNetAccounting?: number | null;
      sumNetForeignCurrency?: number | null;
      sumTax?: number | null;
      sumTaxAccounting?: number | null;
      sumTaxForeignCurrency?: number | null;
      taxRate?: number;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxSet?: {
        id: string;
        objectName: "TaxSet";
      } | null;
      taxText?: string | null;
      taxType?: "custom" | "default" | "eu" | "noteu" | "ss" | null;
      timeToPay?: number | null;
      update?: string;
    };
    Model_PaymentMethodResponse: {
      additionalInformation?: string;
      create?: string;
      electronicInvoiceId?: string;
      id: string;
      name?: string;
      objectName: "PaymentMethod";
      text?: string;
      translationCode?: string;
      update?: string;
    };
    Model_SevUserResponse: {
      additionalInformation?: string;
      clientOwner?: boolean;
      create?: string;
      defaultReceiveMailCopy?: boolean;
      email?: string;
      endDate?: string;
      firstName?: string;
      forcePasswordChange?: boolean;
      fullname?: string;
      gender?: string;
      hideMapsDirections?: boolean;
      id?: number;
      languageCode?: string;
      lastLogin?: string;
      lastLoginIp?: string;
      lastName?: string;
      lastPasswordChange?: string;
      memberCode?: string;
      objectName?: "SevUser";
      role?: "Accountant" | "accountant-light" | "admin" | "checker" | "user";
      sevClient?: Record<string, never>;
      smtpHost?: string;
      smtpMail?: string;
      smtpName?: string;
      smtpPort?: string;
      smtpSsl?: string;
      smtpUser?: string;
      startDate?: string;
      status?: string;
      twoFactorAuth?: boolean;
      update?: string;
      username?: string;
      welcomeScreenSeen?: boolean;
    };
    Model_StaticCountryResponse: {
      additionalInformation?: string;
      code?: string;
      id: string;
      locale?: string;
      name?: string;
      nameEn?: string;
      objectName: "StaticCountry";
      priority?: string;
      translationCode?: string;
    };
    Model_TextTemplate: {
      category?: "DOCUMENT" | "LETTER" | "MAIL";
      name?: string;
      objectType?: "AB" | "ALL" | "AN" | "CN" | "LI" | "MA" | "PAYMENT_CONFIRMATION" | "RE";
      text?: string;
      textType?: "FOOT" | "HEAD" | "SIGNATURE" | "SUBJECT" | "TEXT";
    };
    Model_TextTemplateResponse: {
      category?: "DOCUMENT" | "LETTER" | "MAIL";
      create?: string;
      id?: number;
      main?: boolean;
      name?: string;
      objectType?: "AB" | "ALL" | "AN" | "CN" | "LI" | "MA" | "PAYMENT_CONFIRMATION" | "RE";
      sevClient?: Record<string, never>;
      sevUser?: Record<string, never>;
      text?: string;
      textType?: "FOOT" | "HEAD" | "SIGNATURE" | "SUBJECT" | "TEXT";
      update?: string;
    };
    Factory_Invoice: ({
      id?: number | null;
      objectName?: "Invoice";
      invoiceNumber?: string | null;
      contact: {
        id: number;
        objectName: "Contact";
      };
      contactPerson: {
        id: number;
        objectName: "SevUser";
      };
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      invoiceDate: string;
      header?: string | null;
      headText?: string | null;
      footText?: string | null;
      timeToPay?: number | null;
      discount?: number;
      address?: string | null;
      addressCountry?: {
        id: number;
        objectName: "StaticCountry";
      };
      payDate?: string | null;
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      deliveryDate?: string | null;
      deliveryDateUntil?: number | null;
      status: "100";
      smallSettlement?: boolean | null;
      taxRate?: number;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxText?: string;
      taxType?: "default" | "eu" | "noteu" | "custom" | "ss";
      taxSet?: {
        id: string;
        objectName: "TaxSet";
      } | null;
      dunningLevel?: number | null;
      paymentMethod?: {
        id: number;
        objectName: "PaymentMethod";
      };
      sendDate?: string | null;
      invoiceType: "RE" | "WKR" | "SR" | "MA" | "TR" | "AR" | "ER";
      accountIntervall?: string | null;
      accountNextInvoice?: number | null;
      currency: string;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumDiscounts?: number;
      sumNetForeignCurrency?: number;
      sumTaxForeignCurrency?: number;
      sumGrossForeignCurrency?: number;
      sumDiscountsForeignCurrency?: number;
      sumNetAccounting?: number;
      sumTaxAccounting?: number;
      sumGrossAccounting?: number;
      paidAmount?: number | null;
      showNet?: boolean;
      enshrined?: string;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
      origin?: {
        id: string;
        objectName: "Order";
      } | null;
      customerInternalNote?: string | null;
      propertyIsEInvoice?: boolean | null;
      mapAll: boolean;
    }) & (OneOf<[{
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
    }, {
      taxType: "default" | "eu" | "noteu" | "custom" | "ss";
    }]>);
    Factory_creditNote: ({
      id?: number;
      objectName: "CreditNote";
      mapAll: boolean;
      create?: string;
      update?: string;
      creditNoteNumber?: string;
      contact: {
        id: number;
        objectName: "Contact";
      };
      creditNoteDate: string;
      status: "100";
      header?: string;
      headText?: string | null;
      footText?: string | null;
      addressCountry?: {
        id: number;
        objectName: "StaticCountry";
      } | null;
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      smallSettlement?: boolean | null;
      contactPerson: {
        id: number;
        objectName: "SevUser";
      };
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxRate?: number;
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxText?: string;
      taxType?: string;
      sendDate?: string | null;
      address?: string | null;
      bookingCategory?: "PROVISION" | "ROYALTY_ASSIGNED" | "ROYALTY_UNASSIGNED" | "UNDERACHIEVEMENT" | "ACCOUNTING_TYPE" | null;
      currency: string;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumDiscounts?: number;
      sumNetForeignCurrency?: number;
      sumTaxForeignCurrency?: number;
      sumGrossForeignCurrency?: number;
      sumDiscountsForeignCurrency?: number;
      customerInternalNote?: string | null;
      showNet?: boolean;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
      creditNoteType?: string;
    }) & OneOf<[{
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
    }, {
      taxType: string;
    }]>;
    Factory_Order: ({
      id?: number;
      objectName?: "Order";
      mapAll: boolean;
      create?: string;
      update?: string;
      orderNumber: string;
      contact: {
        id: number;
        objectName: "Contact";
      };
      orderDate: string;
      status: 100;
      header: string;
      headText?: string | null;
      footText?: string | null;
      addressCountry?: {
        id: number;
        objectName: "StaticCountry";
      };
      deliveryTerms?: string | null;
      paymentTerms?: string | null;
      version: number;
      smallSettlement?: boolean;
      contactPerson: {
        id: number;
        objectName: "SevUser";
      };
      taxRate?: number;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      taxText?: string;
      taxType?: string;
      orderType: "AN" | "AB" | "LI";
      sendDate?: string | null;
      address?: string | null;
      currency: string;
      customerInternalNote?: string | null;
      showNet?: boolean;
      sendType?: "VPR" | "VPDF" | "VM" | "VP" | null;
      origin?: {
        id: number;
        objectName: "Order";
      } | null;
    }) & OneOf<[{
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
    }, {
      taxType: string;
    }]>;
    Factory_Voucher: ({
      id?: number;
      objectName: "Voucher";
      mapAll: boolean;
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      createUser?: {
        readonly id: number;
        readonly objectName: "SevUser";
      };
      voucherDate?: string | null;
      supplier?: {
        id: number;
        objectName: "Contact";
      } | null;
      supplierName?: string | null;
      description?: string | null;
      payDate?: string | null;
      status: 50 | 100;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumNetAccounting?: number;
      sumTaxAccounting?: number;
      sumGrossAccounting?: number;
      sumDiscounts?: number;
      sumDiscountsForeignCurrency?: number;
      paidAmount?: number | null;
      taxRule?: {
        id: number;
        objectName: "TaxRule";
      };
      taxType?: string;
      creditDebit: "C" | "D";
      voucherType: "VOU" | "RV";
      currency?: string | null;
      propertyForeignCurrencyDeadline?: string | null;
      propertyExchangeRate?: number | null;
      recurringInterval?: string | null;
      recurringStartDate?: string | null;
      recurringNextVoucher?: string | null;
      recurringLastVoucher?: string | null;
      recurringEndDate?: string | null;
      enshrined?: string;
      taxSet?: {
        id: number;
        objectName: "TaxSet";
      } | null;
      paymentDeadline?: string | null;
      deliveryDate?: string;
      deliveryDateUntil?: string | null;
      document?: {
        id: number;
        objectName: "Document";
      } | null;
      costCentre?: {
        id: number;
        objectName: "CostCentre";
      };
    }) & OneOf<[{
      taxRule: {
        id: number;
        objectName: "TaxRule";
      };
    }, {
      taxType: string;
    }]>;
    Factory_VoucherPos: (WithRequired<({
      id?: number;
      objectName: "VoucherPos";
      mapAll: boolean;
      create?: string;
      update?: string;
      sevClient?: {
        readonly id: number;
        readonly objectName: "SevClient";
      };
      voucher?: {
        readonly id: number;
        readonly objectName: "Voucher";
      };
      accountDatev?: {
        id: number;
        objectName: "AccountDatev";
      };
      accountingType?: {
        id: number;
        objectName: string;
      };
      estimatedAccountingType?: {
        readonly id: number;
        readonly objectName: "AccountingType";
      };
      taxRate: number;
      net: boolean;
      isAsset?: boolean;
      sumNet?: number;
      sumTax?: number;
      sumGross?: number;
      sumNetAccounting?: number;
      sumTaxAccounting?: number;
      sumGrossAccounting?: number;
      comment?: string | null;
    }) & ({
      accountDatev: {
        id: number;
        objectName: "AccountDatev";
      };
    } | {
      accountingType: {
        id: number;
        objectName: string;
      };
    }), "taxRate" | "net" | "mapAll" | "objectName">) & OneOf<[{
      net: true;
      sumNet: number;
      sumGross?: number;
    }, {
      net: false;
      sumGross: number;
      sumNet?: number;
    }]>;
    Write_TextTemplate: {
      category?: "DOCUMENT" | "LETTER" | "MAIL";
      name: string;
      objectType?: "AB" | "ALL" | "AN" | "CN" | "LI" | "MA" | "PAYMENT_CONFIRMATION" | "RE";
      text: string;
      textType?: "FOOT" | "HEAD" | "SIGNATURE" | "SUBJECT" | "TEXT";
    };
  };
  responses: never;
  parameters: {
    countAll?: boolean;
    embed?: string[];
    getAsPdf?: boolean;
    limit?: number;
    offset?: number;
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {
  bookkeepingSystemVersion: {
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              version?: "1.0" | "2.0";
            };
          };
        };
      };
      401: {
        content: never;
      };
    };
  };
  getCheckAccounts: {
    parameters: {
      query?: {
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_CheckAccountResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createFileImportAccount: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["createFileImportAccount"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["createFileImportAccountResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createClearingAccount: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["createClearingAccount"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["createClearingAccountResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getCheckAccountById: {
    parameters: {
      path: {
        checkAccountId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CheckAccountResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateCheckAccount: {
    parameters: {
      path: {
        checkAccountId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CheckAccountUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CheckAccountResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteCheckAccount: {
    parameters: {
      path: {
        checkAccountId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getBalanceAtDate: {
    parameters: {
      query: {
        date: string;
      };
      path: {
        checkAccountId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: string;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getTransactions: {
    parameters: {
      query?: {
        "checkAccount[id]"?: number;
        "checkAccount[objectName]"?: string;
        isBooked?: boolean;
        paymtPurpose?: string;
        startDate?: string;
        endDate?: string;
        payeePayerName?: string;
        onlyCredit?: boolean;
        onlyDebit?: boolean;
        countAll?: boolean;
        limit?: number;
        offset?: number;
        status?: 100 | 200 | 300 | 350 | 400;
        hideFees?: boolean;
        searchForInvoiceAndVoucher?: string;
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_CheckAccountTransactionResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createTransaction: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CheckAccountTransaction"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CheckAccountTransactionResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getCheckAccountTransactionById: {
    parameters: {
      path: {
        checkAccountTransactionId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CheckAccountTransactionResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateCheckAccountTransaction: {
    parameters: {
      path: {
        checkAccountTransactionId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CheckAccountTransactionUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CheckAccountTransactionResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteCheckAccountTransaction: {
    parameters: {
      path: {
        checkAccountTransactionId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  checkAccountTransactionEnshrine: {
    parameters: {
      path: {
        checkAccountTransactionId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  listPrivateTransactionRules: {
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_PrivateTransactionRuleResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createPrivateTransactionRule: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreatePrivateTransactionRule"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": components["schemas"]["Model_PrivateTransactionRuleResponse"];
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deletePrivateTransactionRule: {
    parameters: {
      path: {
        id: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getNextCustomerNumber: {
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: string;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  findContactsByCustomFieldValue: {
    parameters: {
      query: {
        value: string;
        "customFieldSetting[id]"?: string;
        "customFieldSetting[objectName]"?: "ContactCustomFieldSetting";
        customFieldName: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  contactCustomerNumberAvailabilityCheck: {
    parameters: {
      query?: {
        customerNumber?: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: boolean;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContacts: {
    parameters: {
      query?: {
        depth?: "0" | "1";
        customerNumber?: string;
        countAll?: boolean;
        limit?: number;
        offset?: number;
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_ContactResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createContact: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_Contact"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactById: {
    parameters: {
      query?: {
        embed?: components["parameters"]["embed"];
      };
      path: {
        contactId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateContact: {
    parameters: {
      path: {
        contactId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ContactUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteContact: {
    parameters: {
      path: {
        contactId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactTabsItemCountById: {
    parameters: {
      path: {
        contactId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            orders?: number;
            invoices?: number;
            creditNotes?: number;
            documents?: number;
            persons?: number;
            vouchers?: number;
            letters?: number;
            parts?: string;
            invoicePos?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactAddresses: {
    parameters: {
      query?: {
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_ContactAddressResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createContactAddress: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ContactAddress"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactAddressResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactAddressById: {
    parameters: {
      query?: {
        embed?: components["parameters"]["embed"];
      };
      path: {
        contactAddressId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactAddressResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateContactAddress: {
    parameters: {
      path: {
        contactAddressId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ContactAddressUpdate"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactAddressResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteContactAddress: {
    parameters: {
      path: {
        contactAddressId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getCommunicationWays: {
    parameters: {
      query?: {
        type?: "EMAIL" | "FAX" | "MOBILE" | "PHONE" | "WEB";
        main?: "0" | "1";
        contact?: {
          id: string;
          objectName: "Contact";
        };
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_CommunicationWayResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createCommunicationWay: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CommunicationWay"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CommunicationWayResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getCommunicationWayById: {
    parameters: {
      query?: {
        embed?: components["parameters"]["embed"];
      };
      path: {
        communicationWayId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CommunicationWayResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  UpdateCommunicationWay: {
    parameters: {
      path: {
        communicationWayId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CommunicationWayUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CommunicationWayResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteCommunicationWay: {
    parameters: {
      path: {
        communicationWayId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getCommunicationWayKeys: {
    parameters: {
      query?: {
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: ({
                id?: string;
                objectName?: "CommunicationWayKey";
                create?: string;
                upadate?: string;
                name?: "Arbeit" | "Autobox" | "Fax" | "Mobil" | "Newsletter" | "Privat" | "Rechnungsadresse" | " ";
                translationCode?: string;
              })[];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getAccountingContact: {
    parameters: {
      query?: {
        "contact[id]"?: string;
        "contact[objectName]"?: "Contact";
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_AccountingContactResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createAccountingContact: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_AccountingContact"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_AccountingContactResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getAccountingContactById: {
    parameters: {
      path: {
        accountingContactId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_AccountingContactResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateAccountingContact: {
    parameters: {
      path: {
        accountingContactId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_AccountingContactUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_AccountingContactResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteAccountingContact: {
    parameters: {
      path: {
        accountingContactId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getPlaceholder: {
    parameters: {
      query: {
        objectName: "Invoice" | "CreditNote" | "Order" | "Contact" | "Letter" | "Email";
        subObjectName?: "Invoice" | "CreditNote" | "Order" | "Contact" | "Letter";
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_Textparser_fetchDictionaryEntriesByType_response"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactFields: {
    parameters: {
      query?: {
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_ContactCustomFieldResponse"][];
            total?: number;
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createContactField: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ContactCustomField"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactCustomFieldResponse"];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactFieldsById: {
    parameters: {
      path: {
        contactCustomFieldId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactCustomFieldResponse"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateContactfield: {
    parameters: {
      path: {
        contactCustomFieldId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ContactCustomFieldUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactCustomFieldResponse"];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteContactCustomFieldId: {
    parameters: {
      path: {
        contactCustomFieldId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactFieldSettings: {
    parameters: {
      query?: {
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_ContactCustomFieldSettingResponse"][];
            total?: number;
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createContactFieldSetting: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ContactCustomFieldSetting"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactCustomFieldSettingResponse"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getContactFieldSettingById: {
    parameters: {
      path: {
        contactCustomFieldSettingId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactCustomFieldSettingResponse"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateContactFieldSetting: {
    parameters: {
      path: {
        contactCustomFieldSettingId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ContactCustomFieldSettingUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ContactCustomFieldSettingResponse"];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteContactFieldSetting: {
    parameters: {
      path: {
        contactCustomFieldSettingId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getReferenceCount: {
    parameters: {
      path: {
        contactCustomFieldSettingId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getCreditNotes: {
    parameters: {
      query?: {
        status?: "100" | "200" | "300" | "500" | "750" | "1000";
        creditNoteNumber?: string;
        startDate?: number;
        endDate?: number;
        "contact[id]"?: number;
        "contact[objectName]"?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_creditNoteResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createcreditNote: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["saveCreditNote"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["saveCreditNoteResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createCreditNoteFromInvoice: {
    requestBody: {
      content: {
        "application/json": {
          invoice: {
            id: number;
            objectName: "Invoice";
          };
        };
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: {
              creditNote?: components["schemas"]["Model_creditNoteResponse"];
              creditNotePos?: components["schemas"]["Model_creditNotePosResponse"][];
              discount?: components["schemas"]["Model_discountsResponse"][];
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createCreditNoteFromVoucher: {
    requestBody: {
      content: {
        "application/json": {
          voucher: {
            id: number;
            objectName: "Voucher";
          };
        };
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: {
              creditNote?: components["schemas"]["Model_creditNoteResponse"];
              creditNotePos?: components["schemas"]["Model_creditNotePosResponse"][];
              discount?: components["schemas"]["Model_discountsResponse"][];
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getcreditNoteById: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_creditNoteResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updatecreditNote: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_creditNoteUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_creditNoteResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deletecreditNote: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_creditNoteResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  sendCreditNoteByPrinting: {
    parameters: {
      query: {
        sendType: string;
        getAsPdf?: components["parameters"]["getAsPdf"];
      };
      path: {
        creditNoteId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_CreditNote_sendByWithRender"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  creditNoteSendBy: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          sendType: "VPR" | "VP" | "VM" | "VPDF";
          sendDraft: boolean;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_creditNoteResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  creditNoteEnshrine: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  creditNoteGetPdf: {
    parameters: {
      query?: {
        download?: boolean;
        preventSendBy?: boolean;
      };
      path: {
        creditNoteId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              base64encoded?: boolean;
              content?: string;
              filename?: string;
              mimeType?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  sendCreditNoteViaEMail: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          toEmail: string;
          subject: string;
          text: string;
          copy?: boolean;
          additionalAttachments?: string;
          ccEmail?: string;
          bccEmail?: string;
        };
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_creditNote_mailResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  bookCreditNote: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          amount: number;
          date: number;
          type: "FULL_PAYMENT" | "N" | "CB" | "CF" | "O" | "OF" | "MTC";
          checkAccount: {
            id: number;
            objectName: "CheckAccount";
          };
          checkAccountTransaction?: {
            id: number;
            objectName: "CheckAccountTransaction";
          };
          createFeed?: boolean;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            id?: string;
            objectName?: "CreditNoteLog";
            additionalInformation?: string;
            create?: string;
            creditNote?: {
              id: number;
              objectName: "CreditNote";
            };
            fromStatus?: string;
            toStatus?: string;
            ammountPayed?: string;
            bookingDate?: string;
            sevClient?: {
              id: number;
              objectName: "SevClient";
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  creditNoteResetToOpen: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_creditNoteResponse"] & {
              status?: unknown;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  creditNoteResetToDraft: {
    parameters: {
      path: {
        creditNoteId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_creditNoteResponse"] & {
              taxText?: unknown;
              customerInternalNote?: unknown;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  getcreditNotePositions: {
    parameters: {
      query?: {
        "creditNote[id]"?: number;
        "creditNote[objectName]"?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_creditNotePosResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateExportConfig: {
    parameters: {
      path: {
        SevClientId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          accountantNumber: number;
          accountantClientNumber: number;
          accountingYearBegin: number;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportDatevDepricated: {
    parameters: {
      query: {
        Download?: boolean;
        startDate: number;
        endDate: number;
        scope: string;
        withUnpaidDocuments?: boolean;
        withEnshrinedDocuments?: boolean;
        enshrine?: boolean;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": Record<string, never>;
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportDatevCSV: {
    parameters: {
      query: {
        startDate: number;
        endDate: number;
        scope: string;
        exportByPaydate?: boolean;
        includeEnshrined?: boolean;
        enshrineDocuments?: boolean;
        includeDocumentImages?: boolean;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: string;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportDatevXML: {
    parameters: {
      query: {
        startDate: number;
        endDate: number;
        scope: string;
        exportByPaydate?: boolean;
        includeEnshrined?: boolean;
        includeExportedDocuments?: boolean;
        includeDocumentXml?: boolean;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: string;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  generateDownloadHash: {
    parameters: {
      query: {
        jobId: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Export_Progress_Data"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getProgress: {
    parameters: {
      query: {
        hash: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Export_Progress_Data"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  jobDownloadInfo: {
    parameters: {
      query: {
        jobId: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Export_Job_Download_Info"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportInvoice: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "Invoice";
          objectName: "SevQuery";
          filter?: {
            invoiceType?: ("Re" | "SR" | "TR" | "AR" | "ER" | "WKR" | "MA")[];
            startDate?: string;
            endDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportInvoiceZip: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "Invoice";
          objectName: "SevQuery";
          filter?: {
            invoiceType?: ("Re" | "SR" | "TR" | "AR" | "ER" | "WKR" | "MA")[];
            startDate?: string;
            endDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportCreditNote: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "CreditNote";
          objectName: "SevQuery";
          filter?: {
            startDate?: string;
            endDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportVoucher: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "Voucher";
          objectName: "SevQuery";
          filter?: {
            startDate?: string;
            endDate?: string;
            startPayDate?: string;
            endPayDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            filename?: string;
            mimetype?: string;
            base64Encoded?: boolean;
            content?: string;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportTransactions: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "CheckAccountTransaction";
          objectName: "SevQuery";
          filter?: {
            paymtPurpose?: string;
            name?: string;
            startDate?: string;
            endDate?: string;
            startAmount?: number;
            endAmount?: number;
            checkAccount?: {
              id: number;
              objectName: "CheckAccount";
            };
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportVoucherZip: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "Voucher";
          objectName: "SevQuery";
          filter?: {
            startDate?: string;
            endDate?: string;
            startPayDate?: string;
            endPayDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  exportContact: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "Contact";
          objectName: "SevQuery";
          filter?: {
            zip?: number;
            city?: string;
            country?: {
              id: number;
              objectName: "StaticCountry";
            };
            depth?: boolean;
            onlyPeople?: boolean;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getParts: {
    parameters: {
      query?: {
        partNumber?: string;
        name?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_Part"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createPart: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_Part"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_Part"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getPartById: {
    parameters: {
      path: {
        partId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_Part"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updatePart: {
    parameters: {
      path: {
        partId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_PartUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_Part"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  partGetStock: {
    parameters: {
      path: {
        partId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getInvoices: {
    parameters: {
      query?: {
        status?: 100 | 200 | 1000;
        invoiceNumber?: string;
        startDate?: number;
        endDate?: number;
        countAll?: boolean;
        invoiceType?: {
          [key: string]: "AR" | "ER" | "MA" | "RE" | "SR" | "TR" | "WKR";
        };
        offset?: number;
        limit?: number;
        partiallyPaid?: boolean;
        canceled?: boolean;
        contact?: {
          id: number;
          objectName: "Contact";
        };
        paymentMethod?: {
          id: number;
          objectName: "PaymentMethod";
        };
        embed?: ("addressCountry" | "autoSendConfiguration" | "cancled" | "checkAccountTransactionLogs" | "checkAccountTransactionLogs.checkAccountTransaction.checkAccount" | "checkAccountTransactions" | "checkAccountTransactions.checkAccount" | "contact" | "contact.parent" | "costCentre" | "debit" | "delinquent" | "dunningLevel" | "finalInvoiceId" | "isPartiallyPaid" | "lastDunningDate" | "openInvoiceReminderDebit" | "openReminderCharge" | "origin" | "origin.debit" | "paymentMethod" | "propertyAutoGenerateRecurringInvoice" | "propertyIsEInvoice" | "propertyOriginTransaction" | "propertyUseNewCalculation" | "propertyVatChangeChecked" | "swissEsrData" | "tags" | "total")[];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_InvoiceResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createInvoiceByFactory: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["saveInvoice"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["saveInvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getInvoiceById: {
    parameters: {
      query?: {
        embed?: ("addressCountry" | "autoSendConfiguration" | "cancled" | "checkAccountTransactionLogs" | "checkAccountTransactionLogs.checkAccountTransaction.checkAccount" | "checkAccountTransactions" | "checkAccountTransactions.checkAccount" | "contact" | "contact.parent" | "costCentre" | "debit" | "delinquent" | "dunningLevel" | "finalInvoiceId" | "isPartiallyPaid" | "lastDunningDate" | "openInvoiceReminderDebit" | "openReminderCharge" | "origin" | "origin.debit" | "paymentMethod" | "propertyAutoGenerateRecurringInvoice" | "propertyIsEInvoice" | "propertyOriginTransaction" | "propertyUseNewCalculation" | "propertyVatChangeChecked" | "swissEsrData" | "tags" | "total")[];
      };
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateInvoiceById: {
    parameters: {
      query?: {
        embed?: ("addressCountry" | "autoSendConfiguration" | "cancled" | "checkAccountTransactionLogs" | "checkAccountTransactionLogs.checkAccountTransaction.checkAccount" | "checkAccountTransactions" | "checkAccountTransactions.checkAccount" | "contact" | "contact.parent" | "costCentre" | "debit" | "delinquent" | "dunningLevel" | "finalInvoiceId" | "isPartiallyPaid" | "lastDunningDate" | "openInvoiceReminderDebit" | "openReminderCharge" | "origin" | "origin.debit" | "paymentMethod" | "propertyAutoGenerateRecurringInvoice" | "propertyIsEInvoice" | "propertyOriginTransaction" | "propertyUseNewCalculation" | "propertyVatChangeChecked" | "swissEsrData" | "tags" | "total")[];
      };
      path: {
        invoiceId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_InvoiceUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteInvoiceById: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: never;
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getInvoicePositionsById: {
    parameters: {
      query?: {
        limit?: number;
        offset?: number;
        embed?: string[];
        countAll?: components["parameters"]["countAll"];
      };
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_InvoicePosResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createInvoiceFromOrder: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CreateInvoiceFromOrder"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createInvoiceReminder: {
    parameters: {
      query: {
        "invoice[id]": number;
        "invoice[objectName]": "Invoice";
      };
    };
    requestBody: {
      content: {
        "application/json": {
          invoice: {
            id: number;
            objectName: "Invoice";
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getIsInvoicePartiallyPaid: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: boolean;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  cancelInvoice: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  invoiceRender: {
    parameters: {
      query?: {
        getAsPdf?: components["parameters"]["getAsPdf"];
      };
      path: {
        invoiceId: number;
      };
    };
    requestBody?: {
      content: {
        "application/json": {
          forceReload?: boolean;
        };
      };
    };
    responses: {
      201: {
        content: {
          "application/json": OneOf<[{
            pdf?: string;
          }, {
            pages?: number;
            thumbs?: unknown[];
          }]> & {
            docId?: string;
            parameters?: {
                key?: string;
                name?: string;
                value?: string;
                values?: {
                    name?: string;
                    translationCade?: string;
                    value?: string;
                  }[];
                visible?: boolean;
              }[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  sendInvoiceViaEMail: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          toEmail: string;
          subject: string;
          text: string;
          copy?: boolean;
          additionalAttachments?: string;
          ccEmail?: string;
          bccEmail?: string;
          sendXml?: boolean;
        };
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_Email"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  invoiceGetPdf: {
    parameters: {
      query?: {
        download?: boolean;
        preventSendBy?: boolean;
      };
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              base64encoded?: boolean;
              content?: string;
              filename?: string;
              mimeType?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  invoiceGetXml: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: string;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  invoiceSendBy: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          sendType: "VPR" | "VP" | "VM" | "VPDF";
          sendDraft: boolean;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  invoiceEnshrine: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  bookInvoice: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          amount: number;
          date: number;
          type: "FULL_PAYMENT" | "N" | "CB" | "CF" | "O" | "OF" | "MTC";
          checkAccount: {
            id: number;
            objectName: "CheckAccount";
          };
          checkAccountTransaction?: {
            id: number;
            objectName: "CheckAccountTransaction";
          };
          createFeed?: boolean;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            id?: string;
            objectName?: "InvoiceLog";
            additionalInformation?: string;
            create?: string;
            creditNote?: {
              id: number;
              objectName: "Invoice";
            };
            fromStatus?: string;
            toStatus?: string;
            ammountPayed?: string;
            bookingDate?: string;
            sevClient?: {
              id: number;
              objectName: "SevClient";
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  invoiceResetToOpen: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"] & {
              status?: unknown;
              payDate?: unknown;
              enshrined?: unknown;
              accountIntervall?: unknown;
              accountNextInvoice?: unknown;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  invoiceResetToDraft: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"] & {
              payDate?: unknown;
              enshrined?: unknown;
              accountIntervall?: unknown;
              accountNextInvoice?: unknown;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  getInvoicePos: {
    parameters: {
      query?: {
        id?: number;
        "invoice[id]"?: number;
        "invoice[objectName]"?: string;
        "part[id]"?: number;
        "part[objectName]"?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_InvoicePosResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getLetterpapersWithThumb: {
    responses: {
      200: {
        content: {
          "application/json": {
            result?: string;
            letterpapers?: {
                id?: string;
                pdf?: string;
                sevClient?: string;
                name?: string;
                default?: number;
                img?: string;
              }[];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getTemplates: {
    parameters: {
      query?: {
        type?: "Invoice" | "invoicereminder" | "Order" | "Contractnote" | "Packinglist" | "Letter" | "Creditnote";
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            result?: string;
            templates?: {
                id?: string;
                name?: string;
                translationCode?: string;
                sevClient?: string;
                type?: string;
                html?: string;
                default?: number;
                premium?: boolean;
              }[];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateInvoiceTemplate: {
    parameters: {
      query?: {
        getAsPdf?: components["parameters"]["getAsPdf"];
      };
      path: {
        invoiceId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ChangeLayout"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ChangeLayoutResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateOrderTemplate: {
    parameters: {
      query?: {
        getAsPdf?: components["parameters"]["getAsPdf"];
      };
      path: {
        orderId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ChangeLayout"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ChangeLayoutResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateCreditNoteTemplate: {
    parameters: {
      query?: {
        getAsPdf?: components["parameters"]["getAsPdf"];
      };
      path: {
        creditNoteId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_ChangeLayout"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_ChangeLayoutResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getOrders: {
    parameters: {
      query?: {
        status?: 100 | 200 | 300 | 500 | 750 | 1000;
        orderNumber?: string;
        startDate?: number;
        endDate?: number;
        "contact[id]"?: number;
        "contact[objectName]"?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_OrderResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createOrder: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["saveOrder"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["saveOrderResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getOrderById: {
    parameters: {
      path: {
        orderId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_OrderResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateOrder: {
    parameters: {
      path: {
        orderId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_OrderUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_OrderResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteOrder: {
    parameters: {
      path: {
        orderId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getOrderPositionsById: {
    parameters: {
      query?: {
        limit?: number;
        offset?: number;
        embed?: string[];
        countAll?: components["parameters"]["countAll"];
      };
      path: {
        orderId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_OrderPosResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getDiscounts: {
    parameters: {
      query?: {
        limit?: number;
        offset?: number;
        embed?: string[];
        countAll?: components["parameters"]["countAll"];
      };
      path: {
        orderId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_Discount"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getRelatedObjects: {
    parameters: {
      query?: {
        includeItself?: boolean;
        sortByType?: boolean;
        embed?: string[];
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
      };
      path: {
        orderId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_OrderPosResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  sendorderViaEMail: {
    parameters: {
      path: {
        orderId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          toEmail: string;
          subject: string;
          text: string;
          copy?: boolean;
          additionalAttachments?: string;
          ccEmail?: string;
          bccEmail?: string;
        };
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_EmailOrder"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createPackingListFromOrder: {
    parameters: {
      query: {
        "order[id]": number;
        "order[objectName]": "Order";
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CreatePackingListFromOrder"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_OrderResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createContractNoteFromOrder: {
    parameters: {
      query: {
        "order[id]": number;
        "order[objectName]": "Order";
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_CreatePackingListFromOrder"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_OrderResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  orderGetPdf: {
    parameters: {
      query?: {
        download?: boolean;
        preventSendBy?: boolean;
      };
      path: {
        orderId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              base64encoded?: boolean;
              content?: string;
              filename?: string;
              mimeType?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  orderSendBy: {
    parameters: {
      path: {
        orderId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          sendType: "VPR" | "VP" | "VM" | "VPDF";
          sendDraft: boolean;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_OrderResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getOrderPositions: {
    parameters: {
      query?: {
        "order[id]"?: number;
        "order[objectName]"?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_OrderPosResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getOrderPositionById: {
    parameters: {
      path: {
        orderPosId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_OrderPosResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateOrderPosition: {
    parameters: {
      path: {
        orderPosId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_OrderPosUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_OrderPosResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteOrderPos: {
    parameters: {
      path: {
        orderPosId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  voucherFactorySaveVoucher: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["saveVoucher"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["saveVoucherResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  voucherUploadFile: {
    requestBody: {
      content: {
        "multipart/form-data": {
          file: string;
        };
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: {
              pages?: number;
              mimeType?: string;
              originMimeType?: string;
              filename?: string;
              contentHash?: string;
              content?: unknown[];
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getVouchers: {
    parameters: {
      query?: {
        status?: 50 | 100 | 1000;
        creditDebit?: "C" | "D";
        descriptionLike?: string;
        startDate?: number;
        endDate?: number;
        "contact[id]"?: number;
        "contact[objectName]"?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_VoucherResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getVoucherById: {
    parameters: {
      path: {
        voucherId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_VoucherResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateVoucher: {
    parameters: {
      path: {
        voucherId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Model_VoucherUpdate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_VoucherResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  voucherEnshrine: {
    parameters: {
      path: {
        voucherId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  bookVoucher: {
    parameters: {
      path: {
        voucherId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          amount: number;
          date: string;
          type: "FULL_PAYMENT" | "N" | "CB" | "CF" | "O" | "OF" | "MTC";
          checkAccount: {
            id: number;
            objectName: "CheckAccount";
          };
          checkAccountTransaction?: {
            id: number;
            objectName: "CheckAccountTransaction";
          };
          createFeed?: boolean;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            id?: string;
            objectName?: "VoucherLog";
            create?: string;
            voucher?: {
              id: number;
              objectName: string;
            };
            fromStatus?: string;
            toStatus?: string;
            amountPayed?: string;
            bookingDate?: string;
            sevClient?: {
              id: number;
              objectName: "SevClient";
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  voucherResetToOpen: {
    parameters: {
      path: {
        voucherId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_VoucherResponse"] & {
              status?: unknown;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  voucherResetToDraft: {
    parameters: {
      path: {
        voucherId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_VoucherResponse"] & {
              status?: unknown;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      422: {
        content: {
          "application/json": components["schemas"]["validationError"];
        };
      };
      500: {
        content: never;
      };
    };
  };
  getVoucherPositions: {
    parameters: {
      query?: {
        "voucher[id]"?: number;
        "voucher[objectName]"?: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_VoucherPosResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  forAllAccounts: {
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["ReceiptGuideDto"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  forAccountNumber: {
    parameters: {
      query: {
        accountNumber: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["ReceiptGuideDto"][];
          };
        };
      };
      401: {
        content: never;
      };
      422: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  forTaxRule: {
    parameters: {
      query: {
        taxRule: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["ReceiptGuideDto"][];
          };
        };
      };
      401: {
        content: never;
      };
      422: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  forRevenue: {
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["ReceiptGuideDto"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  forExpense: {
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["ReceiptGuideDto"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  reportInvoice: {
    parameters: {
      query: {
        download?: boolean;
        view: string;
        sevQuery: {
          limit?: number;
          modelName: "Invoice";
          objectName: "SevQuery";
          filter?: {
            invoiceType?: ("Re" | "SR" | "TR" | "AR" | "ER" | "WKR" | "MA")[];
            startDate?: string;
            endDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  reportOrder: {
    parameters: {
      query: {
        download?: boolean;
        view: string;
        sevQuery: {
          limit?: number;
          modelName: "Order";
          objectName: "SevQuery";
          filter?: {
            orderType?: "AN" | "AB" | "LI";
            startDate?: string;
            endDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  reportContact: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "Contact";
          objectName: "SevQuery";
          filter?: {
            zip?: number;
            city?: string;
            country?: {
              id: number;
              objectName: "StaticCountry";
            };
            depth?: boolean;
            onlyPeople?: boolean;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  reportVoucher: {
    parameters: {
      query: {
        download?: boolean;
        sevQuery: {
          limit?: number;
          modelName: "Voucher";
          objectName: "SevQuery";
          filter?: {
            startDate?: string;
            endDate?: string;
            startPayDate?: string;
            endPayDate?: string;
            contact?: {
              id: number;
              objectName: "Contact";
            };
            startAmount?: number;
            endAmount?: number;
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: {
              filename?: string;
              mimetype?: string;
              base64Encoded?: boolean;
              content?: string;
            };
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getTags: {
    parameters: {
      query?: {
        id?: number;
        name?: string;
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_TagResponse"][];
            total?: number;
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getTagById: {
    parameters: {
      path: {
        tagId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_TagResponse"][];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateTag: {
    parameters: {
      path: {
        tagId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          name: string;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_TagResponse"];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  deleteTag: {
    parameters: {
      path: {
        tagId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: unknown[];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      409: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  createTag: {
    requestBody: {
      content: {
        "application/json": {
          name?: string;
          object: {
            id: number;
            objectName: "Invoice" | "Voucher" | "Order" | "CreditNote";
          };
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_TagCreateResponse"];
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getTagRelations: {
    parameters: {
      query?: {
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_TagCreateResponse"][];
            total?: number;
          };
        };
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getDocuments: {
    parameters: {
      query?: {
        contact?: {
          id: number;
          objectName: "Contact";
        };
        countAll?: boolean;
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_DocumentResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  updateStatus: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    requestBody: {
      content: {
        "application/json": {
          value: components["schemas"]["Model_Invoice"]["status"];
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getLastDunning: {
    parameters: {
      path: {
        invoiceId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_InvoiceResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getOpenInvoiceReminderDebit: {
    parameters: {
      query: {
        invoice: {
          id: number;
          objectName: "Invoice";
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getSevUsers: {
    parameters: {
      query?: {
        countAll?: components["parameters"]["countAll"];
        offset?: components["parameters"]["offset"];
        limit?: components["parameters"]["limit"];
        embed?: components["parameters"]["embed"];
        ignoreRoles?: {
          0?: string;
          1?: string;
          2?: string;
          3?: string;
          4?: string;
          5?: string;
        };
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_SevUserResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
    };
  };
  getSevUserById: {
    parameters: {
      query?: {
        embed?: components["parameters"]["embed"];
      };
      path: {
        sevUserId: number;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_SevUserResponse"][];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
      500: {
        content: never;
      };
    };
  };
  getTextTemplate: {
    parameters: {
      query?: {
        limit?: number;
        offset?: number;
        embed?: string[];
        category?: "DOCUMENT" | "LETTER" | "MAIL";
        objectType?: "AB" | "ALL" | "AN" | "CN" | "LI" | "MA" | "PAYMENT_CONFIRMATION" | "RE";
        textType?: "FOOT" | "HEAD" | "SIGNATURE" | "SUBJECT" | "TEXT";
        countAll?: components["parameters"]["countAll"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects: components["schemas"]["Model_TextTemplateResponse"][];
            total?: number;
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
    };
  };
  addTextTemplate: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["Write_TextTemplate"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_TextTemplateResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
    };
  };
  updateTextTemplate: {
    parameters: {
      path: {
        id: number;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["Write_TextTemplate"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": {
            objects?: components["schemas"]["Model_TextTemplateResponse"];
          };
        };
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
    };
  };
  deleteTextTemplate: {
    parameters: {
      path: {
        id: number;
      };
    };
    responses: {
      200: {
        content: never;
      };
      400: {
        content: never;
      };
      401: {
        content: never;
      };
    };
  };
}
