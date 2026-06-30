# Sunray_06022026 — columns reference

Generated: 2026-06-30

Total tables: 397 | Total columns: 6355

## dbo.1099_BillPaymentDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| ReferenceNumber | varchar(25) | YES |  |

| ReconStatus | tinyint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| JournalEntryID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| EntryNumber | varchar(100) | YES |  |

| SourceType | smallint | YES |  |

| BillTRansNumber | int | YES |  |

| BillAmount | decimal | NO |  |

| PaidAmount | decimal | YES |  |

| OriginalAmount | decimal | YES |  |

| ParentSourceType | smallint | YES |  |

| JournalStatus | int | YES |  |

| TranStatus | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| BillOrder | int | YES |  |

| TransID | binary(18) | NO |  |

| BillID | binary(18) | YES |  |

| AccountName | varchar(127) | YES |  |

| Memo | varchar(500) | YES |  |

| CheckNo | varchar(25) | NO |  |

| BoxID | int | YES |  |

| BoxName | varchar(100) | YES |  |

| VendorID | binary(18) | YES |  |

| VendorType | smallint | YES |  |

| VendorName | varchar(100) | NO |  |

| VendorPrintCheckAs | varchar(50) | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| PaymentSourceType | smallint | YES |  |

| DiscountType | int | NO |  |

| CheckOrder | smallint | YES |  |

| BillPaymentDate | datetime2 | YES |  |

| PaymentMethod | varchar(50) | NO |  |

| VoidDate | datetime2 | YES |  |

## dbo.1099_CheckAndReceiptEntries

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Amount | decimal | YES |  |

| PuposeID | binary(18) | YES |  |

| PurposeType | smallint | YES |  |

| SourceType | smallint | YES |  |

| EntryDate | datetime2 | NO |  |

| TransNumber | int | YES |  |

| JournalEntryID | binary(18) | YES |  |

| VendorType | smallint | YES |  |

| VendorID | binary(18) | YES |  |

| BoxID | int | YES |  |

| BoxName | varchar(100) | YES |  |

| CheckNo | varchar(25) | NO |  |

| EntryNumber | varchar(100) | YES |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(100) | NO |  |

| PrintCheckAs | varchar(50) | YES |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| AccountName | varchar(127) | YES |  |

| Memo | varchar(500) | YES |  |

| CheckOrder | smallint | YES |  |

| BillOrder | int | NO |  |

| PaymentMethod | varchar(50) | NO |  |

| VoidDate | datetime2 | YES |  |

| JournalStatus | int | YES |  |

| ParentSourceType | smallint | YES |  |

## dbo.1099_JournalDirectEntries

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Amount | decimal | YES |  |

| PuposeID | binary(18) | YES |  |

| PurposeType | smallint | YES |  |

| SourceType | smallint | YES |  |

| EntryDate | datetime2 | NO |  |

| TransNumber | int | YES |  |

| JournalEntryID | binary(18) | YES |  |

| VendorType | smallint | YES |  |

| VendorID | binary(18) | YES |  |

| BoxID | int | YES |  |

| BoxName | varchar(100) | YES |  |

| EntryNumber | varchar(100) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(100) | NO |  |

| PrintCheckAs | varchar(50) | YES |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| Memo | varchar(500) | YES |  |

| CheckOrder | smallint | YES |  |

| BillOrder | int | NO |  |

| AccountName | varchar(127) | YES |  |

| VoidDate | datetime2 | YES |  |

| JournalStatus | int | YES |  |

| ParentSourceType | smallint | YES |  |

## dbo.1099ChangeMappingTempTable

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| ReqID | varchar(100) | YES |  |

| VendorID | binary(18) | YES |  |

| JournalEntryID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| BoxLineID | int | YES |  |

## dbo.1099MiscBoxLines

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| Name | varchar(100) | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| OrderID | int | YES |  |

## dbo.1099MiscExcludeSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| Name | varchar(50) | YES |  |

| ClientID | binary(18) | YES |  |

| Status | smallint | YES |  |

## dbo.1099MiscThreshold

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BoxLineID | int | YES |  |

| Amount | decimal | YES |  |

| ClientID | binary(18) | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedOn | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

## dbo.Account

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | YES | (NULL) |

| AccountTypeID | binary(18) | NO |  |

| AccountName | varchar(100) | NO |  |

| AccountNumber | varchar(25) | YES |  |

| AccountDescription | varchar(200) | YES | (NULL) |

| BankAccountNumber | varchar(50) | YES | (NULL) |

| OpeningBalance | decimal | NO |  |

| AccountCreationDate | date | YES | (NULL) |

| ParentAccountID | binary(18) | YES | (NULL) |

| GLID | binary(18) | YES | (NULL) |

| Status | tinyint | NO |  |

| StatementDate | datetime2 | YES | (NULL) |

| PrevStatementDate | datetime2 | YES | (NULL) |

| SourceType | tinyint | YES | (NULL) |

| Website | varchar(150) | YES |  |

| ICFAType | bit | YES |  |

| RefID | binary(18) | YES |  |

| CommonMappingID | binary(18) | YES |  |

| ServiceType | tinyint | YES |  |

| BoxLineID | int | YES |  |

| AID | bigint | NO |  |

| ISParentID | tinyint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedDateBy | datetime | YES |  |

| ModifiedDateBy | datetime | YES |  |

## dbo.AccountClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | YES |  |

| AccountTypeID | binary(18) | NO |  |

| AccountName | varchar(100) | NO |  |

| AccountNumber | varchar(25) | YES |  |

| AccountDescription | varchar(200) | YES |  |

| BankAccountNumber | varchar(50) | YES |  |

| OpeningBalance | decimal | NO |  |

| AccountCreationDate | date | YES |  |

| ParentAccountID | binary(18) | YES |  |

| GLID | binary(18) | YES |  |

| Status | tinyint | NO |  |

| StatementDate | datetime2 | YES |  |

| PrevStatementDate | datetime2 | YES |  |

| SourceType | tinyint | YES |  |

| Website | varchar(150) | YES |  |

| ICFAType | bit | YES |  |

| RefID | binary(18) | YES |  |

| ServiceType | tinyint | YES |  |

## dbo.AccountMap

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| AccountNumber | varchar(25) | YES |  |

| AccountName | varchar(100) | NO |  |

| MapID | binary(18) | YES |  |

| MapType | smallint | YES |  |

| Type | smallint | YES |  |

| Status | tinyint | NO |  |

## dbo.AccountMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | YES | (NULL) |

| AccountID | binary(18) | NO |  |

| TargetID | binary(18) | YES | (NULL) |

| Type | tinyint | YES | (NULL) |

| DebitCredit | bit | YES | (NULL) |

| Status | smallint | YES |  |

## dbo.AccountMappingDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| MappingID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| AccountMappingID | binary(18) | YES |  |

| DebitCredit | bit | YES |  |

| MappingAccountID | binary(18) | YES |  |

| Status | smallint | YES |  |

| Order | smallint | YES |  |

## dbo.AccountReportLine

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| ReportLineID | binary(18) | NO |  |

## dbo.AccountType

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| AccountTypeName | varchar(50) | NO |  |

| ParentAccountTypeID | binary(18) | YES | (NULL) |

| AccountTypeOrder | smallint | YES | (NULL) |

| Status | smallint | NO |  |

| Description | varchar(100) | YES | (NULL) |

## dbo.AccrualDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| EmployeeID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| Hrs | decimal | YES |  |

| Rate | decimal | YES |  |

| Amount | decimal | YES |  |

| Month | int | NO |  |

| Year | int | NO |  |

| CorporationID | binary(18) | NO |  |

| Type | tinyint | NO |  |

## dbo.AddOn

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(100) | NO |  |

| Type | tinyint | NO |  |

| FranchiseeID | binary(18) | YES |  |

| BaseAmount | decimal | NO |  |

| IsDefault | bit | NO |  |

| VisibleHome | bit | NO |  |

| Status | tinyint | NO |  |

## dbo.Address

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Address1 | varchar(250) | YES | (NULL) |

| Address2 | varchar(250) | YES | (NULL) |

| State | bigint | YES | (NULL) |

| Country | bigint | YES | (NULL) |

| ZipCode | varchar(15) | YES | (NULL) |

| City | varchar(50) | YES | (NULL) |

## dbo.AdjustOpeningBalance

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| ProfitCenter | binary(18) | YES |  |

| AdjustableAmount | varchar(20) | YES |  |

| AsOfDate | datetime | YES |  |

| CreatedBy | binary(18) | YES |  |

| CreatedDate | datetime | YES |  |

| UpdatedBy | binary(18) | YES |  |

| UpdatedDate | datetime | YES |  |

## dbo.AlertSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| CorporationID | binary(18) | NO |  |

| UserID | binary(18) | NO |  |

| AlertTime | varchar(5) | NO |  |

| TimeZone | varchar(5) | NO |  |

| EffectiveDate | datetime | NO |  |

| OtherEmailId | varchar(200) | YES |  |

| PCID | binary(18) | YES |  |

| SaleStartDate | datetime | NO | ('') |

## dbo.APFilterReq

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReqID | bigint | YES |  |

| ReqSourceType | smallint | YES |  |

| FilterColumnType | smallint | YES |  |

| Value | varchar(500) | YES |  |

| OperationType | smallint | YES |  |

## dbo.ApprovalComments

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Id | bigint | NO |  |

| JournalEntryID | binary(18) | YES |  |

| Comment | varchar(2000) | YES |  |

| CommentedBy | binary(18) | YES |  |

| ApprovalLevel | smallint | YES |  |

| CommentDate | datetime2 | YES |  |

| AuditID | bigint | YES |  |

| Status | smallint | YES |  |

## dbo.ApprovalPloicy

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| TransactionType | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.ApprovalPloicyDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ApprovalPolicyID | bigint | YES |  |

| ApprovalType | smallint | YES |  |

| AssignedTo | binary(18) | YES |  |

| ApprovalOrder | int | YES |  |

| LimitAmount | decimal | YES |  |

## dbo.AutoPostingInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalEntryID | binary(18) | NO |  |

| PaymentMethodID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| RunDate | datetime2 | NO |  |

| SourceID | binary(18) | YES |  |

| IsEntryPosted | bit | NO |  |

## dbo.AutoReconcilationSequence

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| TransactionID | binary(18) | YES |  |

| SequenceID | int | YES |  |

| Status | bit | YES |  |

## dbo.BalanceSheet_Configuration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| DepartmenID | smallint | NO |  |

| GroupID | bigint | NO |  |

| Status | tinyint | NO |  |

| CommonMappingID | binary(18) | YES |  |

## dbo.BalanceSheet_ConfigurationDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ConfigID | bigint | NO |  |

| AccountID | binary(18) | YES |  |

| Order | smallint | YES |  |

| Status | tinyint | YES |  |

## dbo.BalanceSheet_Group

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DepartmentID | smallint | NO |  |

| Name | varchar(205) | YES |  |

| ParentID | bigint | YES |  |

| Order | smallint | NO |  |

| NoHeading | smallint | NO |  |

| Status | smallint | NO |  |

| ClientID | binary(18) | NO |  |

| GroupLevel | smallint | YES |  |

## dbo.BalanceSheetGroupView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| BalanceSheetNameOrder | varchar(255) | YES |  |

| ID | bigint | NO |  |

| DepartmentID | smallint | NO |  |

| ClientID | binary(18) | NO |  |

| GroupLevel | smallint | YES |  |

| Name | varchar(56) | NO |  |

| ActualName | varchar(50) | NO |  |

| Status | smallint | NO |  |

| Order | smallint | NO |  |

| I2ID | bigint | YES |  |

| I3ID | bigint | YES |  |

| I4ID | bigint | YES |  |

| I5ID | bigint | YES |  |

| IName2 | varchar(50) | YES |  |

| IName3 | varchar(50) | YES |  |

| IName4 | varchar(50) | YES |  |

| IName5 | varchar(50) | YES |  |

## dbo.Bank

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BankName | varchar(50) | NO |  |

| Status | smallint | NO |  |

| ClientID | binary(18) | NO |  |

## dbo.BankConnectAccounts

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AccNo | bigint | NO |  |

| AccName | varchar(50) | YES |  |

| BankConnectLogInID | bigint | YES |  |

| AccountID | binary(18) | YES |  |

| LastFeedDate | datetime2 | YES |  |

| Status | tinyint | YES |  |

## dbo.BankConnectInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Customer_ID | varchar(50) | NO |  |

| Status | tinyint | YES |  |

| BankCustID | varchar(20) | YES |  |

## dbo.BankConnectLogins

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | NO |  |

| LoginNo | bigint | YES |  |

| LoginName | varchar(50) | YES |  |

| Status | tinyint | YES |  |

| LastLoginRefreshDate | datetime | YES |  |

## dbo.BankDeposit

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DepositType | smallint | NO |  |

| DateFrom | date | NO |  |

| DateTo | date | NO |  |

| Status | tinyint | YES | (NULL) |

## dbo.BankDepositSalesEntry

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| BankDepositID | binary(18) | NO |  |

| SalesEntryID | binary(18) | NO |  |

## dbo.BankFeedImportFormatSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ClientID | binary(18) | YES |  |

| FormatName | varchar(100) | YES |  |

| ColumnCount | int | YES |  |

| TemplatePath | varchar(500) | YES |  |

| Date | varchar(50) | YES |  |

| Memo | varchar(50) | YES |  |

| Num | varchar(50) | YES |  |

| DataReadfrom | int | YES |  |

| AmountType | smallint | YES |  |

| AmountMode | smallint | YES |  |

| AmountColumn1 | varchar(50) | YES |  |

| AmountColumn2 | varchar(50) | YES |  |

| Status | smallint | YES |  |

| IsHeader | smallint | YES |  |

## dbo.BankFeedRuleDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| RuleID | bigint | YES |  |

| DescriptionAmount | smallint | YES |  |

| SourceType | smallint | YES |  |

| Value | varchar(300) | YES |  |

## dbo.BankFeedRules

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| MappedAccountID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| SetupFor | varchar(300) | NO |  |

| Memo | nvarchar(3000) | YES |  |

| Type | smallint | NO |  |

| AutoApply | bit | YES |  |

| priority | smallint | YES |  |

| ConditionType | bit | YES |  |

| ActualTransactionType | smallint | NO |  |

| PayeeID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| ToCorporationID | binary(18) | YES |  |

| IsModified | smallint | YES |  |

| Status | smallint | YES |  |

| RuleCreatedFrom | smallint | YES |  |

## dbo.BankFeedsReconciliation

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Type | smallint | NO |  |

| Date | datetime | YES |  |

| Number | varchar(100) | YES |  |

| Amount | decimal | YES |  |

| Description | varchar(100) | YES |  |

| MatchesQTY | varchar(50) | YES |  |

| IsMatched | bit | YES |  |

| IsSelected | bit | YES |  |

| RelatedTransactionID | bit | YES |  |

| Order | int | YES |  |

| TransactionID | binary(18) | YES |  |

| Status | smallint | YES |  |

| AccountID | binary(18) | NO |  |

| ReconciliationID | binary(18) | YES |  |

| SequenceID | int | YES |  |

## dbo.BankFeedsSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| ClientID | binary(18) | YES |  |

| NeedPendingTrans | bit | YES |  |

| Hours | int | YES |  |

| AMorPM | smallint | YES |  |

| TimeZoneID | int | YES |  |

| ConvertedTime | varchar(30) | YES |  |

| TransactionRange | int | YES |  |

| AutoMatchBasedOn | bit | YES |  |

| IncludeReconcileTransaction | bit | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedOn | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| Status | smallint | YES |  |

| EnableFeedRule | bit | YES |  |

| DsCashCheck | bit | YES |  |

| ViewFormat | bit | YES |  |

| IsSynched | bit | YES |  |

## dbo.BankImportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BankLoginId | bigint | YES |  |

| StatementEndDate | datetime2 | YES |  |

| EndBalance | decimal | YES |  |

| Status | smallint | YES |  |

## dbo.BankImportSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BankLoginID | bigint | YES |  |

| NimbleName | varchar(50) | YES |  |

| FileName | varchar(50) | YES |  |

## dbo.BatchPrint

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BatchID | int | YES |  |

| JournalID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| PrintCount | int | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| UpdatedOn | datetime2 | YES |  |

| PrintedOn | datetime2 | YES |  |

| PrintedBy | binary(18) | YES |  |

| UpdatedBy | binary(18) | YES |  |

| Status | smallint | YES |  |

| Order | bigint | YES |  |

| ClientID | binary(18) | YES |  |

## dbo.BilledTimeSheets

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| InfoDate | datetime2 | YES |  |

| SourceType | tinyint | NO |  |

| Billable | bit | NO |  |

## dbo.BilledUnBilledTimeSheets

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| SourceType | tinyint | NO |  |

| InfoDate | datetime2 | YES |  |

## dbo.BillEntryAIInformationDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| TransactionID | binary(18) | NO |  |

| BillEntryInformationID | bigint | NO |  |

| PurposeID | binary(18) | NO |  |

| AIPurposeName | varchar(150) | YES |  |

| Description | varchar(500) | YES |  |

| Type | varchar(150) | YES |  |

| Status | smallint | YES |  |

| Amount | decimal | YES |  |

| PurposeUpdated | bit | YES |  |

## dbo.BillEntryDebiitMemoPreference

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.BillEntryInformation

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalEntryID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Outstanding | decimal | YES |  |

| SourceID | binary(18) | YES |  |

| DebitCredit | smallint | YES |  |

| Status | smallint | YES |  |

| TransactionID | binary(18) | YES |  |

| EntryDate | datetime2 | YES |  |

| CreditTermID | binary(18) | YES |  |

| RefType | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| ContractID | binary(18) | YES |  |

| EntryNumber | varchar(150) | YES |  |

| BillDate | datetime2 | YES |  |

| CorporationID | binary(18) | YES |  |

| CreatedBy | binary(18) | YES |  |

| ApprovalStatus | smallint | YES |  |

| MEMO | varchar(800) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| PayMethodID | binary(18) | YES |  |

| PolCurStatus | smallint | YES |  |

| EntryType | smallint | YES |  |

| IsAttachement | bit | YES |  |

| VoidDate | datetime2 | YES |  |

| IsHoldPayment | bit | YES |  |

| ApprovedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| AssignedTo | binary(18) | YES |  |

| ExternalEntityID | smallint | YES |  |

| IsRegisterEnabled | bit | YES |  |

## dbo.BillEntryInformationDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BillInfoID | bigint | NO |  |

| Amount | decimal | YES |  |

| Outstanding | decimal | YES |  |

| PCID | binary(18) | YES |  |

## dbo.BillEntryPayments

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SourceID | binary(18) | YES |  |

| BillInformationID | bigint | YES |  |

| BillPaymentID | binary(18) | YES |  |

| PaidAmount | decimal | YES |  |

| OutStanding | decimal | YES |  |

| AdjustmentAmount | decimal | YES |  |

| AdjustID | binary(18) | YES |  |

| Discount | decimal | YES |  |

| DiscountAccountID | binary(18) | YES |  |

| Status | smallint | YES |  |

| TransactioonID | binary(18) | YES |  |

| AdjustTransactionID | binary(18) | YES |  |

| DiscountReconciliationID | binary(18) | YES |  |

| DiscountTransactionID | binary(18) | YES |  |

| DiscountReconStatus | smallint | YES |  |

| BillPaymentInformationID | bigint | YES |  |

| PCID | binary(18) | YES |  |

| DiscountMemo | varchar(200) | YES |  |

## dbo.BillOutStanding

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| PaymentID | binary(18) | NO |  |

| OutStanding | decimal | YES |  |

| BillID | binary(18) | YES |  |

## dbo.BillPaymentDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| ReconStatus | tinyint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| JournalEntryID | binary(18) | NO |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(50) | YES |  |

| JournalSourceType | smallint | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| TransNumber | int | YES |  |

| BillAmount | decimal | NO |  |

| DiscountAmount | decimal | YES |  |

| PaidAmount | decimal | YES |  |

| OriginalAmount | decimal | YES |  |

| ParentSourceType | smallint | YES |  |

| JournalStatus | int | YES |  |

| TranStatus | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| BillOrder | smallint | YES |  |

| TransID | binary(18) | NO |  |

| PaymentJournalEntryID | binary(18) | NO |  |

| AccountName | varchar(127) | YES |  |

| PurposeName | varchar(100) | YES |  |

| Memo | varchar(500) | YES |  |

## dbo.BillPaymentImportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| PayDate | datetime2 | NO |  |

| Amount | decimal | NO |  |

| Number | varchar(50) | YES |  |

| PaymethodID | binary(18) | NO |  |

| BankAccountID | binary(18) | NO |  |

| VendorID | binary(18) | NO |  |

| Status | smallint | NO |  |

| PaymentMemo | varchar(255) | YES |  |

## dbo.BillPaymentImportMappingDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BillPayImportID | bigint | NO |  |

| BillJournalID | binary(18) | NO |  |

| Status | smallint | NO |  |

## dbo.BillPaymentsInformation

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalEntryID | binary(18) | YES |  |

| CheckNo | varchar(200) | YES |  |

| Amount | decimal | YES |  |

| ReconciliationID | binary(18) | YES |  |

| Reconstatus | smallint | YES |  |

| BillInformationID | bigint | YES |  |

| SourceID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| Memo | varchar(400) | YES |  |

| AdjustTransactionID | binary(18) | YES |  |

| DiscountTransactionID | binary(18) | YES |  |

| TransactionID | binary(18) | YES |  |

| DebitCredit | bit | YES |  |

| ApprovedBy | binary(18) | YES |  |

| Status | smallint | YES |  |

| ContractID | binary(18) | YES |  |

| EntryDate | datetime2 | YES |  |

| AssignedTo | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| PayMethodID | binary(18) | YES |  |

| PolCurStatus | smallint | YES |  |

| ApprovalStatus | smallint | YES |  |

| EntryType | smallint | YES |  |

| EPaymentStatus | smallint | YES |  |

| VoidDate | datetime2 | YES |  |

| IsAttachement | bit | YES |  |

## dbo.BillPaymentSourceAdjustments

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| ReferenceNumber | varchar(25) | YES |  |

| ReconStatus | tinyint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| JournalEntryID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| EntryNumber | varchar(100) | YES |  |

| SourceType | smallint | YES |  |

| BillTRansNumber | int | YES |  |

| BillAmount | decimal | NO |  |

| PaidAmount | decimal | YES |  |

| OriginalAmount | decimal | YES |  |

| ParentSourceType | smallint | YES |  |

| JournalStatus | int | YES |  |

| TranStatus | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| BillOrder | smallint | YES |  |

| TransID | binary(18) | NO |  |

| BillID | binary(18) | NO |  |

| AccountName | varchar(127) | YES |  |

| Memo | varchar(500) | YES |  |

| CheckNo | varchar(25) | NO |  |

| BoxID | int | YES |  |

| BoxName | varchar(100) | YES |  |

| VendorID | binary(18) | YES |  |

| VendorType | smallint | YES |  |

| VendorName | varchar(100) | NO |  |

| VendorPrintCheckAs | varchar(50) | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| PaymentSourceType | smallint | YES |  |

| BillOrDebitMemo | int | NO |  |

| CheckOrder | smallint | YES |  |

| BillPaymentDate | datetime2 | NO |  |

| PaymentMethod | varchar(50) | NO |  |

| VoidDate | datetime2 | YES |  |

## dbo.BillPaymentTargetAdjustments

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| ReferenceNumber | varchar(25) | YES |  |

| ReconStatus | tinyint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| JournalEntryID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| EntryNumber | varchar(100) | YES |  |

| SourceType | smallint | YES |  |

| BillTRansNumber | int | YES |  |

| BillAmount | decimal | NO |  |

| PaidAmount | decimal | YES |  |

| OriginalAmount | decimal | YES |  |

| ParentSourceType | smallint | YES |  |

| JournalStatus | int | YES |  |

| TranStatus | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| BillOrder | smallint | YES |  |

| TransID | binary(18) | NO |  |

| BillID | binary(18) | NO |  |

| AccountName | varchar(127) | YES |  |

| Memo | varchar(500) | YES |  |

| CheckNo | varchar(25) | NO |  |

| BoxID | int | YES |  |

| BoxName | varchar(100) | YES |  |

| VendorID | binary(18) | YES |  |

| VendorType | smallint | YES |  |

| VendorName | varchar(100) | NO |  |

| VendorPrintCheckAs | varchar(50) | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| PaymentSourceType | smallint | YES |  |

| BillOrDebitMemo | int | NO |  |

| CheckOrder | smallint | YES |  |

| BillPaymentDate | datetime2 | NO |  |

| PaymentMethod | varchar(50) | NO |  |

| VoidDate | datetime2 | YES |  |

## dbo.BillPayOrInvoiceAdjust

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| TargetID | binary(18) | NO |  |

| TargetType | smallint | YES |  |

| TransactionID | binary(18) | YES |  |

| Status | smallint | NO |  |

| AdjustmentDate | datetime2 | YES |  |

## dbo.BudgetCorpDayWiseIncome

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | YES |  |

| Stats | decimal | NO |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| EnableADRORAVG | smallint | YES |  |

| LineID | binary(18) | YES |  |

| DeptType | int | YES |  |

| DaywiseAmount | decimal | NO |  |

| DaywiseStatistics | decimal | NO |  |

| DaywiseDate | datetime2 | YES |  |

| DepartmentType | varchar(1) | YES |  |

| DaywiseStats | decimal | NO |  |

## dbo.BudgetCorpIncome

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | YES |  |

| TotalAvailableRooms | bigint | NO |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | NO |  |

| Stats | decimal | NO |  |

| ActStats | decimal | NO |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| EnableADRORAVG | smallint | NO |  |

| LineID | binary(18) | YES |  |

| DeptType | int | YES |  |

| BGDepartmentType | varchar(1) | YES |  |

| ConfigID | binary(18) | NO |  |

## dbo.BudgetCorporationWiseDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ACTColumn | bigint | YES |  |

| ACTDaywiseColumn | bigint | YES |  |

| MonthDaywise | decimal | YES |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | int | YES |  |

| Amount | decimal | NO |  |

| Stats | decimal | NO |  |

| Statistics | decimal | NO |  |

| DepartmentType | smallint | YES |  |

| DaywiseStats | decimal | NO |  |

| DaywiseAmount | decimal | NO |  |

| DaywiseStatistics | decimal | NO |  |

| LineID | binary(18) | YES |  |

| DeptType | smallint | YES |  |

| RoomType | smallint | YES |  |

| IsGuest | int | NO |  |

| DaywiseDate | datetime2 | YES |  |

| StoreID | binary(18) | NO |  |

| IsRoomsSold | int | NO |  |

| AccountTypeID | binary(18) | YES |  |

| YR | int | YES |  |

| FrmYr | int | YES |  |

## dbo.BudgetCorpWiseDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | NO |  |

| Stats | decimal | NO |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| EnableADRORAVG | smallint | YES |  |

| LineID | binary(18) | YES |  |

| DeptType | int | YES |  |

| AccountTypeID | binary(18) | YES |  |

| ActColumnNo | bigint | YES |  |

## dbo.BudgetCorpWiseIncome

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | NO |  |

| Stats | decimal | NO |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| EnableADRORAVG | smallint | YES |  |

| LineID | binary(18) | YES |  |

| DeptType | int | YES |  |

## dbo.BudgetDepartmentwiseGroupNames

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | varbinary(18) | NO |  |

| GroupName | varchar(100) | NO |  |

| DepartmentType | int | YES |  |

## dbo.BudgetDetailAssumptionAccounts

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AssumptionID | bigint | YES |  |

| AccountID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| Statistics | decimal | NO |  |

| MainAccountID | binary(18) | NO |  |

| GroupID | binary(18) | NO |  |

| IntermID | binary(18) | NO |  |

| Type | smallint | YES |  |

## dbo.BudgetDetailAssumptions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BudgetForecastConfigID | binary(18) | YES |  |

| IntermID | binary(18) | YES |  |

| GroupID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| DependentAccountID | binary(18) | YES |  |

| AssumptionID | bigint | YES |  |

| Date | datetime2 | YES |  |

| ColumnNo | int | YES |  |

| AmountStatistics | decimal | YES |  |

| Shifts | decimal | YES |  |

| Minutes | decimal | YES |  |

| Hours | decimal | YES |  |

| Wages | decimal | YES |  |

| Amount | decimal | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.BudgetDetailsUpdated

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| StoreID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| GroupID | binary(18) | NO |  |

| DeptType | varchar(1) | YES |  |

| ConfigID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | YES |  |

| Stats | decimal | YES |  |

| Statstics | decimal | YES |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| BudYear | int | YES |  |

| DaywiseDate | datetime2 | YES |  |

| DaywiseStatistics | decimal | YES |  |

| DaywiseAmount | decimal | YES |  |

| IsDayWiseBudget | int | NO |  |

## dbo.BudgetDetDaywise

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| StoreID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| GroupID | binary(18) | NO |  |

| DeptType | smallint | YES |  |

| ConfigID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | YES |  |

| Stats | decimal | YES |  |

| Statstics | decimal | YES |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| ACTColumn | bigint | YES |  |

| DayBudget | decimal | YES |  |

| DayBudgetStats | decimal | YES |  |

## dbo.BudgetDetDayWiseOnlyStats

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ConfigID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| LineID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | YES |  |

| Stats | decimal | YES |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| DayBudget | decimal | YES |  |

## dbo.BudgetDetMonthWise

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| StoreID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | YES |  |

| Stats | decimal | YES |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| DayBudget | decimal | YES |  |

## dbo.BudgetDetMonthWiseOnlyStats

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| LineID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | YES |  |

| Stats | decimal | YES |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| DayBudget | decimal | YES |  |

## dbo.BudgetFCAssumptionView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| IntermID | binary(18) | YES |  |

| GroupID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| StatisticsAssumption | varchar(103) | YES |  |

| AmountAssumption | varchar(103) | YES |  |

| Type | smallint | YES |  |

## dbo.BudgetForeCast

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| PreperationType | smallint | YES |  |

| Name | varchar(100) | YES |  |

| Description | varchar(250) | YES |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| BudgetType | smallint | YES |  |

| LockPassword | varchar(16) | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| ParentID | binary(18) | YES |  |

| TotalAvailableRooms | bigint | YES |  |

| StoreID | binary(18) | YES |  |

| IsRoomCountMIsmatch | smallint | YES |  |

## dbo.BudgetForecastAssumptions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| IntermID | binary(18) | YES |  |

| GroupID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Assumption | int | YES |  |

| AssumptionType | int | YES |  |

| AssumptionPrepare | int | YES |  |

| dependentAccountID | binary(18) | YES |  |

| AssumptionFor | int | YES |  |

| AssumptionName | varchar(300) | YES |  |

| AssumptionAmount | decimal | YES |  |

| AssumptionHrs | decimal | YES |  |

| AssumptionWage | decimal | YES |  |

| Type | smallint | YES |  |

## dbo.BudgetForeCastConfigDayWiseDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BudgetForeCastConfigDetailsID | binary(18) | YES |  |

| Date | datetime2 | YES |  |

| Amount | decimal | YES |  |

| Statistics | decimal | YES |  |

## dbo.BudgetForeCastConfigDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BudgetForeCastDetailsID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Statistics | decimal | YES |  |

| DistributionAssumptionType | smallint | YES |  |

| LineID | binary(18) | YES |  |

| Date | datetime2 | YES |  |

| Status | smallint | YES |  |

## dbo.BudgetForecastCorporationWiseDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ACTColumn | bigint | YES |  |

| ACTDaywiseColumn | bigint | YES |  |

| MonthDaywise | decimal | YES |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | int | YES |  |

| Amount | decimal | NO |  |

| Stats | decimal | NO |  |

| Statistics | decimal | NO |  |

| DepartmentType | smallint | YES |  |

| DaywiseStats | decimal | NO |  |

| DaywiseAmount | decimal | NO |  |

| DaywiseStatistics | decimal | NO |  |

| LineID | binary(18) | YES |  |

| DeptType | smallint | YES |  |

| RoomType | smallint | YES |  |

| IsGuest | int | NO |  |

| DaywiseDate | datetime2 | YES |  |

| StoreID | binary(18) | NO |  |

| IsRoomsSold | int | NO |  |

| AccountTypeID | binary(18) | YES |  |

| YR | int | YES |  |

| FrmYr | int | YES |  |

## dbo.BudgetForeCastDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BudgetForeCastIntermID | binary(18) | NO |  |

| GroupID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| Statistics | decimal | YES |  |

| ColumnName | varchar(50) | YES |  |

| ColumnNo | smallint | NO |  |

| RowAssumptionType | smallint | YES |  |

| RowAssumptionVal | decimal | YES |  |

| ColAssumptionType | smallint | YES |  |

| ColAssumptionVal | decimal | YES |  |

| DependentAccountID | binary(18) | YES |  |

| Status | smallint | NO |  |

## dbo.BudgetForeCastInterm

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BudgetID | binary(18) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| AssumptionType | smallint | YES |  |

| AssumptionVal | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| LockPassword | varchar(16) | YES |  |

| Status | smallint | YES |  |

| IsDayWise | bit | YES |  |

## dbo.BudgetGroupConfigure

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GroupID | binary(18) | NO |  |

| AccountID | binary(18) | NO |  |

| DetailOrder | smallint | YES |  |

| Status | smallint | NO |  |

| EnableDaywise | bit | YES |  |

## dbo.BudgetGroupConfigureClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GroupID | binary(18) | NO |  |

| AccountID | binary(18) | NO |  |

| DetailOrder | smallint | YES |  |

| Status | smallint | NO |  |

## dbo.BudgetGroupName

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GroupName | varchar(100) | NO |  |

| AccountTypeID | binary(18) | YES |  |

| Status | smallint | YES |  |

| GroupOrder | smallint | YES |  |

| CorporationID | binary(18) | YES |  |

| Type | smallint | YES |  |

| MapID | binary(18) | YES |  |

| ServiceType | tinyint | YES |  |

| DepartmentID | varchar(50) | YES |  |

## dbo.BudgetGroupNameClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GroupName | varchar(100) | NO |  |

| AccountTypeID | binary(18) | YES |  |

| Status | smallint | YES |  |

| GroupOrder | smallint | YES |  |

| CorporationID | binary(18) | YES |  |

| Type | smallint | YES |  |

| ServiceType | tinyint | YES |  |

| DepartmentID | varchar(50) | YES |  |

## dbo.BudgetStatistics

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| LineID | binary(18) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| GroupID | binary(18) | NO |  |

| DeptType | int | YES |  |

| ConfigID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| ColumnNo | smallint | NO |  |

| Amount | decimal | YES |  |

| Stats | decimal | YES |  |

| Statstics | decimal | YES |  |

| PeriodFrom | datetime2 | YES |  |

| PeriodTo | datetime2 | YES |  |

| FrmMnth | int | YES |  |

| FrmYr | int | YES |  |

| ToMnth | int | YES |  |

| ToYr | int | YES |  |

| DayBudget | decimal | YES |  |

| DayBudgetStats | decimal | YES |  |

| RoomType | int | NO |  |

| ACTColumn | bigint | YES |  |

## dbo.Business

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Type | smallint | NO |  |

| Name | varchar(100) | NO |  |

| CompanyName | varchar(100) | YES | (NULL) |

| ContactID | binary(18) | YES | (NULL) |

| AddressID | binary(18) | YES | (NULL) |

| BankID | binary(18) | YES | (NULL) |

| CorporationID | binary(18) | NO |  |

| Terms | binary(18) | YES | (NULL) |

| AccountID | binary(18) | YES | (NULL) |

| CheckReference | varchar(50) | YES | (NULL) |

| TaxID | varchar(15) | YES | (NULL) |

| CreditLimit | decimal | YES | (NULL) |

| Status | smallint | NO |  |

| TaxPercentage | decimal | YES | (NULL) |

| ContactPersonName | varchar(50) | YES | (NULL) |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| ParentID | binary(18) | YES |  |

| BID | bigint | NO |  |

| CreatedDateBy | datetime | YES |  |

| ModifiedDateBy | datetime | YES |  |

## dbo.BusinessDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BusinessID | binary(18) | YES |  |

| NameID | binary(18) | YES |  |

| MarkupType | tinyint | YES |  |

| Percentage | decimal | YES |  |

## dbo.BusinessInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| FederalID | varchar(15) | YES |  |

| PrintCheckAs | varchar(50) | YES |  |

| DoingBusinessAs | varchar(50) | YES |  |

| Salutation | tinyint | YES |  |

| FirstName | varchar(50) | YES |  |

| MiddleName | varchar(50) | YES |  |

| LastName | varchar(50) | YES |  |

| DeliveryAddressID | binary(18) | YES |  |

| BusinessTypeID | binary(18) | YES |  |

| CreditDaysID | binary(18) | YES |  |

| SendMethodID | binary(18) | YES |  |

| PaymentMethodID | binary(18) | YES |  |

| CreditCardNo | varchar(20) | YES |  |

| CreditCardExpiryDate | varchar(5) | YES |  |

| NameOnCreditCard | varchar(50) | YES |  |

| Notes | varchar(500) | YES |  |

| Is1099 | bit | YES |  |

| IsAddressSame | bit | YES |  |

| IsInterCompany | bit | YES |  |

| SSN | varchar(16) | YES |  |

| DefaultAccount | binary(18) | YES |  |

| Line1 | binary(18) | YES |  |

| Line2 | binary(18) | YES |  |

| Line3 | binary(18) | YES |  |

| CheckTemplate | smallint | YES |  |

| PrintCheck | bit | YES |  |

| ToBePrinted | bit | YES |  |

| AccountNumber | varchar(20) | YES |  |

| IsAutoBill | bit | YES |  |

| PostDays | tinyint | YES |  |

| CorpExpDate | datetime | YES |  |

| PrintChkCon | bit | YES |  |

| UseTaxID | bigint | YES |  |

| Print1099As | varchar(50) | YES |  |

## dbo.BusinessPercentage

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BusinessID | binary(18) | YES |  |

| ManRecRepType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| CommissionType | smallint | YES |  |

| CommissionAmount | decimal | YES |  |

| OverheadAmount | decimal | YES |  |

| Order | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.BusinessPreferences

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BusinessID | binary(18) | NO |  |

| ClientID | binary(18) | NO |  |

| FrachisePayment | bit | YES |  |

| MakePaymentAlso | bit | YES |  |

## dbo.BusinessRelatedExtension

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| MarkupType | smallint | YES |  |

| MarkupAmount | decimal | YES |  |

| FrequencyID | binary(18) | YES |  |

| InvoiceStartDate | varchar(5) | YES |  |

## dbo.BusinessTokenDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Token | varchar(200) | YES |  |

| AddressToken | varchar(200) | YES |  |

| IsAutoPayment | bit | YES |  |

| NumberofTimes | bigint | YES |  |

| RemindmeBefore | int | YES |  |

| Email | varchar(500) | YES |  |

| IsUnlimited | bit | YES |  |

| TransNumber | bigint | YES |  |

| BillEntriesScheduled | bigint | YES |  |

## dbo.BusinessView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | smallint | NO |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(104) | NO |  |

| ActualName | varchar(100) | NO |  |

| Status | smallint | NO |  |

| S2ID | binary(18) | YES |  |

| S3ID | binary(18) | YES |  |

| BusinessNameOrder | varchar(303) | YES |  |

| ContactID | binary(18) | YES |  |

| AddressID | binary(18) | YES |  |

| SName2 | varchar(100) | YES |  |

| SName3 | varchar(100) | YES |  |

## dbo.BusinessViewFOR1099

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | smallint | NO |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(104) | NO |  |

| ActualName | varchar(100) | NO |  |

| Status | smallint | NO |  |

| S2ID | binary(18) | YES |  |

| S3ID | binary(18) | YES |  |

| BusinessNameOrder | varchar(303) | YES |  |

| ContactID | binary(18) | YES |  |

| AddressID | binary(18) | YES |  |

| SName2 | varchar(100) | YES |  |

| SName3 | varchar(100) | YES |  |

| FederalID | varchar(15) | YES |  |

| SSN | varchar(16) | YES |  |

| Is1099 | bit | YES |  |

| VendorAddress | varchar(250) | YES |  |

| VendorState | varchar(75) | YES |  |

| VendorCountry | varchar(50) | YES |  |

| ZipCode | varchar(15) | YES |  |

| City | varchar(50) | YES |  |

## dbo.Card

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Type | smallint | NO |  |

| Status | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| Description | varchar(100) | YES | (NULL) |

## dbo.CashBasis_GeneralLedger

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalEntryID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| CorporationName | varchar(100) | YES |  |

| EntryDate | datetime2 | YES |  |

| EntryNumber | varchar(50) | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| JournalStatus | smallint | YES |  |

| TransNumber | int | YES |  |

| IsAccural | smallint | YES |  |

| CreatedBy | varchar(100) | YES |  |

| ModifiedBy | varchar(100) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| TransactionID | binary(18) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AccountName | varchar(200) | YES |  |

| AccountID1 | binary(18) | YES |  |

| AccountName1 | varchar(200) | YES |  |

| AccountID2 | binary(18) | YES |  |

| AccountName2 | varchar(200) | YES |  |

| AccountID3 | binary(18) | YES |  |

| AccountName3 | varchar(300) | YES |  |

| AccountID4 | binary(18) | YES |  |

| AccountName4 | varchar(200) | YES |  |

| ParentTransactionID | binary(18) | YES |  |

| ParentId3 | binary(18) | YES |  |

| ParentID2 | binary(18) | YES |  |

| ParentId1 | binary(18) | YES |  |

| ParentId0 | binary(18) | YES |  |

| Amount | decimal | YES |  |

| DebitCredit | bit | YES |  |

| TransactionDate | datetime2 | YES |  |

| Memo | varchar(500) | YES |  |

| Split | varchar(200) | YES |  |

| TransactionStatus | smallint | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| ProfitCenterName | varchar(100) | YES |  |

| ProfitCenterID1 | binary(18) | YES |  |

| ProfitCenterID2 | binary(18) | YES |  |

| NameID | binary(18) | YES |  |

| Name | varchar(1000) | YES |  |

| NameType | tinyint | YES |  |

| TransSourceID | binary(18) | YES |  |

| TransSourceName | varchar(100) | YES |  |

| TransSourceType | smallint | YES |  |

| ReconcileStatus | tinyint | YES |  |

| ReferenceNumber | varchar(50) | YES |  |

| DayType | smallint | YES |  |

| StoreId | binary(18) | YES |  |

| FranchiseId | binary(18) | YES |  |

| TAccountID | binary(18) | YES |  |

| CostCenterId | binary(18) | YES |  |

| ParentAccountTypeId | binary(18) | YES |  |

| OpeningBalance | decimal | YES |  |

| JESourceID | binary(18) | YES |  |

| SourceTypeName | varchar(50) | YES |  |

| AsofDate | datetime2 | YES |  |

| StoreName | varchar(100) | YES |  |

| CostCentreName | varchar(100) | YES |  |

| ParentId | binary(18) | YES |  |

| PurposeID | binary(18) | YES |  |

| BankTransactionID | binary(18) | YES |  |

| CashEntryDate | datetime2 | YES |  |

| TransOrder | smallint | YES |  |

| MJID | binary(18) | YES |  |

## dbo.CategoryMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(100) | YES |  |

| SourceID | binary(18) | YES |  |

| DebitAccountID | binary(18) | YES |  |

| CreditAccountID | binary(18) | YES |  |

| StoreFranchiseeID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

## dbo.ChartOfAccount

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| AccountNumberName | varchar(135) | YES |  |

| AccountsName | varchar(108) | NO |  |

| AccountNumber | varchar(25) | YES |  |

| AccountName | varchar(100) | NO |  |

| ParentID3 | binary(18) | YES |  |

| ParentName3 | varchar(100) | YES |  |

| ParentNumber3 | varchar(25) | YES |  |

| ParentID2 | binary(18) | YES |  |

| ParentName2 | varchar(100) | YES |  |

| ParentNumber2 | varchar(25) | YES |  |

| Status | tinyint | NO |  |

| ParentStatus3 | tinyint | YES |  |

| ParentStatus2 | tinyint | YES |  |

| ParentID1 | binary(18) | YES |  |

| ParentName1 | varchar(100) | YES |  |

| ParentNumber1 | varchar(25) | YES |  |

| ParentID0 | binary(18) | YES |  |

| ParentName0 | varchar(100) | YES |  |

| ParentNumber0 | varchar(25) | YES |  |

| ParentStatus1 | tinyint | YES |  |

| ParentStatus0 | tinyint | YES |  |

| AccountTypeID | binary(18) | NO |  |

| SourceID | binary(18) | YES |  |

| AccountTypeName | varchar(50) | NO |  |

| AccountTypeOrder | smallint | YES |  |

| AccountNameOrder | varchar(630) | YES |  |

| MarkerID | binary(18) | YES |  |

| SourceType | tinyint | YES |  |

| ICFAType | bit | YES |  |

| AccountCode1 | varchar(25) | YES |  |

| AccountCode2 | varchar(25) | YES |  |

| AccountCode3 | varchar(25) | YES |  |

| AccountCode4 | varchar(25) | YES |  |

| AccountCode5 | varchar(25) | YES |  |

| DecAccountNum | decimal | YES |  |

| CreatedBy | binary(18) | YES |  |

| CreatedDateBy | datetime | YES |  |

| ModifiedBy | binary(18) | YES |  |

| ModifiedDateBy | datetime | YES |  |

| ActAccountName | varchar(104) | YES |  |

| ActAccountNumber | varchar(25) | YES |  |

## dbo.CheckEntries

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| OriginalAmount | decimal | YES |  |

| PaidAmount | decimal | YES |  |

| DebitCredit | bit | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| ReconStatus | tinyint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| JournalEntryID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(100) | YES |  |

| JournalSourceType | smallint | YES |  |

| TransNumber | int | YES |  |

| PaymentMethodName | varchar(50) | YES |  |

| ParentSourceType | smallint | YES |  |

| JournalStatus | int | YES |  |

| TranStatus | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| Order | smallint | YES |  |

| AccountName | varchar(127) | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| ReconciliationDate | varchar(8) | YES |  |

| Memo | varchar(500) | YES |  |

| ParentID | binary(18) | YES |  |

| VoidDate | datetime2 | YES |  |

## dbo.ClientGaRequest

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserID | binary(18) | NO |  |

| UserGAID | binary(18) | NO |  |

| RequestDate | date | NO |  |

| Status | smallint | NO |  |

| MessageID | binary(18) | YES | (NULL) |

## dbo.CombinedReportParameterDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| RequestID | varchar(100) | YES |  |

| CorporationID | binary(18) | YES |  |

| Status | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| EntryDate | datetime2 | YES |  |

| AccountID | binary(18) | YES |  |

| VoidDate | datetime2 | YES |  |

## dbo.CommissionDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BusinessID | binary(18) | YES |  |

| Type | tinyint | YES |  |

| CommissionType | tinyint | YES |  |

| Percentage | decimal | YES |  |

| Amount | decimal | YES |  |

## dbo.ConfigDetailPerIncomeSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ConfigID | bigint | NO |  |

| AccountId | binary(18) | YES |  |

| AccountName | varchar(100) | YES |  |

| Accountno | varchar(50) | YES |  |

| Department | varchar(100) | YES |  |

| Type | varchar(50) | YES |  |

| ParentAccountId | binary(18) | YES |  |

| ParentAccountName | varchar(100) | YES |  |

## dbo.Contact

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ContactName | varchar(50) | YES |  |

| Phone1 | varchar(50) | YES | (NULL) |

| Phone2 | varchar(50) | YES | (NULL) |

| Phone3 | varchar(50) | YES | (NULL) |

| HomeNum | varchar(50) | YES |  |

| AlternateNum | varchar(50) | YES |  |

| Fax | varchar(20) | YES | (NULL) |

| Email | varchar(100) | YES | (NULL) |

| Website | varchar(100) | YES | (NULL) |

| ContactTime | varchar(50) | YES | (NULL) |

| VendorID | varchar(200) | YES |  |

| OwnerName | varchar(100) | YES |  |

## dbo.CorpACHSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| MerchantID | varchar(100) | YES |  |

| LocationID | varchar(100) | YES |  |

| PaymentAccountID | binary(18) | YES |  |

| DepositAccountID | binary(18) | YES |  |

| Type | smallint | YES |  |

| Status | smallint | NO |  |

| APIKey | varchar(100) | YES |  |

| SecurityKey | varchar(100) | YES |  |

| AESEncryptedAuth | varchar(300) | YES |  |

| PRoviderType | smallint | YES |  |

| TransactionId | varchar(100) | YES |  |

| RepayAccessToken | nvarchar(100) | YES |  |

## dbo.CorpDiscountAccountConfiguration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Status | smallint | YES |  |

## dbo.CorpDMPref

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| DaysCnt | int | YES |  |

| FIFOLIFO | smallint | YES |  |

## dbo.Corporation

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ClientID | binary(18) | NO |  |

| CorporationName | varchar(100) | NO |  |

| COASettings | tinyint | YES |  |

| LegalName | varchar(100) | YES | (NULL) |

| DoingBusinessName | varchar(50) | YES | (NULL) |

| ContactID | binary(18) | YES | (NULL) |

| AddressID | binary(18) | YES | (NULL) |

| FederalID | varchar(15) | YES | (NULL) |

| CorporationStateID | varchar(15) | YES | (NULL) |

| WithholdingID | varchar(15) | YES | (NULL) |

| UnEmploymentID | varchar(15) | YES | (NULL) |

| LocalPayrolTaxID | varchar(15) | YES | (NULL) |

| PeriodDateStart | varchar(5) | YES | (NULL) |

| PeriodDateEnd | varchar(5) | YES | (NULL) |

| IncorporationDate | date | YES | (NULL) |

| CorporationClosedDate | date | YES | (NULL) |

| SalesStartDate | date | YES | (NULL) |

| BusinessEndDate | date | YES |  |

| LockDate | date | YES | (NULL) |

| FinancialYear | smallint | YES | (NULL) |

| Status | smallint | NO |  |

| LockPasssword | varchar(15) | YES | (NULL) |

| ShortName | varchar(20) | YES | (NULL) |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CountryID | bigint | YES |  |

| CompanyTypeID | binary(18) | YES |  |

| LegalAddressID | binary(18) | YES |  |

| PurposeEnabled | bit | YES |  |

| ProfitCenterEnabled | bit | YES |  |

| CostCenterEnabled | bit | YES |  |

| WeekDay | tinyint | YES |  |

| IsTaxApplicable | bit | YES |  |

| DueDate | datetime2 | YES |  |

| PayrollLiablityDueDate | datetime2 | YES |  |

| PropertyType | tinyint | YES |  |

| HotelChain | tinyint | YES |  |

| ServiceType | tinyint | YES |  |

| IsVoidDelete | smallint | YES |  |

| PMSType | smallint | YES |  |

| RegionID | binary(18) | YES |  |

| PortpolioID | binary(18) | YES |  |

| SortOrder | smallint | YES |  |

| Order | int | YES |  |

| AccountCode | varchar(15) | YES |  |

| TotalAvailableRooms | bigint | YES |  |

| TransNumber | bigint | YES |  |

| BookkeepingMail | varchar(250) | YES |  |

| IsAutoBill | bit | YES |  |

| PostDays | tinyint | YES |  |

| EnableTaxInVendorMaster | smallint | YES |  |

| IsAutoApproval | bit | YES |  |

| IsDualBrand | bit | YES |  |

| DefaultSettings | smallint | YES |  |

| SaleStartDate | date | YES | (NULL) |

## dbo.CorporationAccountSetting

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| PaymentAccountID | binary(18) | YES |  |

| ReceiptAccountID | binary(18) | YES |  |

| CreditCardAccountID | binary(18) | YES |  |

| Status | smallint | YES |  |

## dbo.CorporationBankDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AddressID | binary(18) | YES |  |

| BranchCode | varchar(50) | YES |  |

| VoidAfter | varchar(50) | YES |  |

| Memo | varchar(500) | YES |  |

| CheckNumber | varchar(50) | YES |  |

| AccountNumber | varchar(50) | YES |  |

| RoutingNumber | varchar(50) | YES |  |

| Status | tinyint | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| BankName | varchar(500) | YES |  |

| CorpName | varchar(100) | YES |  |

| DBAName | varchar(100) | YES |  |

| CorpAddress | varchar(500) | YES |  |

| CorpCountryID | bigint | YES |  |

| CorpStateID | bigint | YES |  |

| CorpCity | varchar(50) | YES |  |

| CorpZipCode | varchar(15) | YES |  |

| isAttached | smallint | YES |  |

| AttachedOn | datetime2 | YES |  |

| AttachedBy | binary(18) | YES |  |

| UpdatedOn | datetime2 | YES |  |

| UpdatedBy | binary(18) | YES |  |

| SignaturePath | varchar(500) | YES |  |

| isDefault | bit | YES |  |

| SignOrder | int | YES |  |

## dbo.CorporationDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationName | varchar(100) | NO |  |

| StartDate | datetime | YES |  |

| EndDate | datetime | YES |  |

| ClientID | binary(18) | NO |  |

| Status | smallint | NO |  |

| ProfitCenterEnabled | bit | YES |  |

| CostCenterEnabled | bit | YES |  |

| LegalName | varchar(100) | YES |  |

## dbo.CorporationFranchisee

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | NO |  |

| FranchiseeID | binary(18) | NO |  |

## dbo.CorporationRoomAvailableforBudget

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationId | binary(18) | YES |  |

| PCId | binary(18) | YES |  |

| RoomCount | bigint | YES |  |

| Date | date | YES |  |

| EffectiveYear | int | YES | (NULL) |

## dbo.CorporationRoomCountDet

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationId | binary(18) | YES |  |

| PCId | binary(18) | YES |  |

| RoomCount | bigint | YES |  |

| EffectiveFrom | date | YES |  |

| EffectiveTo | date | YES |  |

| Status | smallint | NO |  |

## dbo.CorporationTaxSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| EnableTax | bit | NO |  |

| Status | smallint | NO |  |

| ClientID | binary(18) | NO | (0xF749BBDD9BB62D8448E53F537E921C450000) |

## dbo.CorporationYearEndProcess

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| FromPeriod | datetime2 | NO |  |

| ToPeriod | datetime2 | NO |  |

| ProcessStatus | bit | NO |  |

| JournalEntryID | binary(18) | YES |  |

## dbo.CorpPaymentFilter

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| HideNAPayMethods | smallint | YES |  |

| HideOtherPayMethods | smallint | YES |  |

## dbo.CorpViewTransaction

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| ViewTransactionType | smallint | YES |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| Tpe | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.CorpYodleeRegister

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorpID | binary(18) | NO |  |

| Type | smallint | NO |  |

| Status | smallint | YES |  |

| CreatedDate | datetime2 | YES |  |

| ClientID | binary(18) | YES |  |

## dbo.CostCenter

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(54) | NO |  |

| ParentID1 | binary(18) | YES |  |

| ParentName1 | varchar(50) | YES |  |

| ParentID0 | binary(18) | YES |  |

| ParentName0 | varchar(50) | YES |  |

| Status | smallint | NO |  |

| ParentStatus1 | smallint | YES |  |

| ParentStatus0 | smallint | YES |  |

| CorporationID | binary(18) | NO |  |

| ActualName | varchar(50) | NO |  |

| DepartmentNameOrder | varchar(153) | YES |  |

## dbo.Country

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Code | char(2) | NO |  |

| Name | varchar(50) | NO |  |

| Status | int | NO |  |

| CurrencyCode | char(3) | YES | (NULL) |

| IsDefault | smallint | YES |  |

## dbo.CreditTerm

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CreditDays | binary(18) | YES | (NULL) |

| DueDate | date | NO |  |

| ShipDate | date | YES |  |

| ShipVia | binary(18) | YES |  |

| ManagerID | binary(18) | YES |  |

| RecruiterID | binary(18) | YES |  |

| RepresentativeID | binary(18) | YES |  |

| ContactID | binary(18) | YES |  |

## dbo.CustAndVendorTransactionsList

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| TransNumber | int | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| ParentCustID | binary(18) | YES |  |

| ParentCustName | varchar(100) | YES |  |

| Number | varchar(100) | YES |  |

| Amount | decimal | YES |  |

| AccountName | varchar(127) | YES |  |

| CLR | varchar(1) | NO |  |

| CorporationName | varchar(100) | NO |  |

| StoreName | varchar(50) | YES |  |

| StoreID | binary(18) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Memo | varchar(500) | YES |  |

| DueDate | date | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| Balance | decimal | NO |  |

| DebitCredit | bit | NO |  |

| TransID | binary(18) | NO |  |

| JID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| FranchiseeName | varchar(50) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| TSourceID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AccountStatus | tinyint | NO |  |

| AccountTypeID | binary(18) | NO |  |

| BankType | varchar(1) | NO |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TSourceType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransactionDate | datetime2 | NO |  |

| Order | smallint | YES |  |

| JESourceID | binary(18) | YES |  |

| Name | varchar(100) | YES |  |

| Debit | decimal | NO |  |

| Credit | decimal | NO |  |

| CreditDays | int | YES |  |

| VoidDate | datetime2 | YES |  |

## dbo.CustomMessage

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ClientID | binary(18) | NO |  |

| Subject | varchar(100) | NO |  |

| Description | varchar(1024) | YES |  |

| Type | smallint | YES |  |

| Status | tinyint | YES |  |

## dbo.CustomType

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

## dbo.CustomTypeField

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CustomTypeID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Type | smallint | YES | (NULL) |

| Sort | smallint | YES | (NULL) |

## dbo.CustomTypeValue

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| FieldID | binary(18) | NO |  |

| Value | varchar(255) | YES | (NULL) |

| Status | tinyint | YES | (NULL) |

## dbo.DailyConfigCreditCardType

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | nvarchar(100) | NO |  |

| Status | smallint | YES |  |

| DeptType | smallint | YES |  |

| DeptTypeOrder | smallint | YES |  |

## dbo.DailyConfigDepartment

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| DeptType | smallint | YES |  |

## dbo.DailyConfigGroup

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | nvarchar(100) | YES |  |

| DepartmentID | binary(18) | YES |  |

| ParentGroupID | binary(18) | YES |  |

| Order | bigint | YES |  |

| IncomeSubDepartmentID | bigint | YES |  |

| Status | smallint | YES |  |

| CommonMappingID | binary(18) | YES |  |

## dbo.DailyConfigGroupclone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | nvarchar(100) | YES |  |

| DepartmentID | binary(18) | YES |  |

| ParentGroupID | binary(18) | YES |  |

| Order | bigint | YES |  |

| IncomeSubDepartmentID | bigint | YES |  |

| Status | smallint | YES |  |

| ServiceType | tinyint | YES |  |

## dbo.DailyConfigInputEntry

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| CashJournalID | binary(18) | YES |  |

| RevenueJournalID | binary(18) | YES |  |

| Status | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModofiedBy | binary(18) | YES |  |

| ModifiedDate | datetime2 | YES |  |

| ApprovedBy | binary(18) | YES |  |

| ApprovedDate | datetime2 | YES |  |

| IsConfigMismatch | bit | YES |  |

| ImportType | smallint | YES |  |

| AssignedTo | binary(18) | YES |  |

| ApprovalLevel | smallint | YES |  |

| ApprovalStatus | smallint | YES |  |

| IsAttachment | smallint | YES |  |

| IsAutomatic | smallint | YES |  |

| IsReimported | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| DCID | bigint | NO |  |

| RoomsCount | bigint | YES |  |

| Weather | nvarchar(100) | YES | (NULL) |

## dbo.DailyConfigInputEntry_AR

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DailyConfigInputID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| CAccountID | binary(18) | YES |  |

| DAccountID | binary(18) | YES |  |

| CreditRefID | binary(18) | YES |  |

| DebitRefID | binary(18) | YES |  |

| DARID | bigint | NO |  |

## dbo.DailyConfigInputEntry_ARDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DConfigIERevID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Amount | decimal | YES |  |

| Description | varchar(150) | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| CrRefID | binary(18) | YES |  |

| DrRefID | binary(18) | YES |  |

## dbo.DailyConfigInputEntry_Receipt

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DailyConfigInputID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| CAccountID | binary(18) | YES |  |

| DAccountID | binary(18) | YES |  |

| CreditRefID | binary(18) | YES |  |

| DebitRefID | binary(18) | YES |  |

| DRID | bigint | NO |  |

## dbo.DailyConfigInputEntry_ReceiptDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DConfigCashID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Description | varchar(150) | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| RefID | binary(18) | YES |  |

| CrRefID | binary(18) | YES |  |

| DrRefID | binary(18) | YES |  |

## dbo.DailyConfigInputEntry_Revenue

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DailyConfigInputID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| CAccountID | binary(18) | YES |  |

| DAccountID | binary(18) | YES |  |

| CreditRefID | binary(18) | YES |  |

| DebitRefID | binary(18) | YES |  |

| DRVID | bigint | NO |  |

## dbo.DailyConfigInputEntry_RevenueDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DConfigIERevID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Description | varchar(150) | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| RefID | binary(18) | YES |  |

## dbo.DailyConfigInputEntry_Statistics

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DailyConfigInputID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| CAccountID | binary(18) | YES |  |

| DAccountID | binary(18) | YES |  |

| DSID | bigint | NO |  |

## dbo.DailyConfigInputEntry_StatisticsDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DConfigIESDID | binary(18) | YES |  |

| Description | varchar(500) | YES |  |

| Count | bigint | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

## dbo.DailyConfigLine

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | nvarchar(100) | YES |  |

| DepartmentID | binary(18) | YES |  |

| GroupID | binary(18) | YES |  |

| Order | bigint | YES |  |

| EnableADRORAVG | smallint | YES |  |

| EnableNegative | bit | YES |  |

| ExcludeFromTotals | bit | YES |  |

| EnableMultiple | bit | YES |  |

| CreditAccountID | binary(18) | YES |  |

| DebitAccountID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| Status | smallint | YES |  |

| CommonMappingID | binary(18) | YES |  |

| ServiceType | tinyint | YES |  |

| ExcludeFromActualDeposit | smallint | YES |  |

| ARLedgerType | smallint | YES |  |

| isVacantRooms | smallint | YES |  |

| ARNetType | smallint | YES |  |

| RoomType | smallint | YES |  |

| AdjustNetAmountto | smallint | YES |  |

| AdjustLedgerType | smallint | YES |  |

| AdjustLedgerNet | smallint | YES |  |

| AdjustLedgerWithAcountsOnlyLine | smallint | YES |  |

| AdjustLedgerNetID | binary(18) | YES |  |

| LaborStatisticsParentID | binary(18) | YES |  |

| LaborStatisticsLineType | smallint | YES |  |

| LaborStatisticsAvgLine | smallint | YES |  |

| IsHouseKeepingDepartment | tinyint | YES |  |

| LabourStatisticsGroupOrder | bigint | YES |  |

| LaborActiveStatus | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| DLID | bigint | NO |  |

| CreditCardTypId | binary(18) | YES |  |

| statisticsCalculationType | smallint | YES |  |

## dbo.DailyConfigLineClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | nvarchar(100) | YES |  |

| DepartmentID | binary(18) | YES |  |

| GroupID | binary(18) | YES |  |

| Order | bigint | YES |  |

| EnableADRORAVG | smallint | YES |  |

| EnableNegative | bit | YES |  |

| ExcludeFromTotals | bit | YES |  |

| EnableMultiple | bit | YES |  |

| CreditAccountID | binary(18) | YES |  |

| DebitAccountID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| Status | smallint | YES |  |

| ServiceType | tinyint | YES |  |

| ExcludeFromActualDeposit | smallint | YES |  |

| ARLedgerType | smallint | YES |  |

| isVacantRooms | smallint | YES |  |

| ARNetType | smallint | YES |  |

| RoomType | smallint | YES |  |

| AdjustNetAmountto | smallint | YES |  |

| AdjustLedgerType | smallint | YES |  |

| AdjustLedgerNet | smallint | YES |  |

| AdjustLedgerWithAcountsOnlyLine | smallint | YES |  |

| isCustomer | smallint | YES |  |

| LaborStatisticsParentID | binary(18) | YES |  |

| LaborStatisticsLineType | smallint | YES |  |

| LaborStatisticsAvgLine | smallint | YES |  |

| IsHouseKeepingDepartment | tinyint | YES |  |

## dbo.DailyConfigLines

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| StoreID | binary(18) | YES |  |

| LineID | binary(18) | NO |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| GroupID | binary(18) | YES |  |

| GroupName | nvarchar(100) | YES |  |

| ParentGroupID | binary(18) | YES |  |

| ParentGroupName | nvarchar(100) | YES |  |

| GroupOrder | bigint | YES |  |

| ParentGroupORder | bigint | YES |  |

| DepartmentID | binary(18) | NO |  |

| DepartmentName | nvarchar(100) | NO |  |

| DeptType | smallint | YES |  |

| EnableNegative | bit | YES |  |

| EnableADRORAVG | smallint | YES |  |

| CorporationID | binary(18) | YES |  |

| Status | smallint | YES |  |

| CreditAccountID | binary(18) | YES |  |

| DebitAccountID | binary(18) | YES |  |

| grpDeptID | bigint | YES |  |

| RoomType | smallint | YES |  |

| ARLedgerType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| DPType | smallint | YES |  |

| ExcludeFromActualDeposit | smallint | YES |  |

| EnableMultiple | bit | YES |  |

## dbo.DailyConfigVerification

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DailyConfigInputID | binary(18) | NO |  |

| Type | smallint | NO |  |

| LineID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| IsEnding | smallint | YES |  |

## dbo.DailyImport

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationId | binary(18) | NO |  |

| Status | smallint | YES |  |

## dbo.DailyImportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| MappingId | bigint | NO |  |

| AccountDescription | varchar(250) | YES |  |

| ItemDescription | varchar(250) | YES |  |

| LineId | binary(18) | YES |  |

| Order | int | YES |  |

| IsLineMapped | bit | YES |  |

| MapLineID | binary(18) | YES |  |

| Signs | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.DailyInputADRIncomeDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | NO |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| Qty | decimal | NO |  |

| RevAmount | decimal | NO |  |

| RoomSoldAmount | decimal | NO |  |

| SourceType | int | NO |  |

| CreditAccountID | binary(18) | YES |  |

| EnableADRORAVG | smallint | YES |  |

| ParentDepartmentID | bigint | YES |  |

| DepartmentID | bigint | NO |  |

| DepartmentName | varchar(100) | YES |  |

| DepartmentOrder | tinyint | YES |  |

## dbo.DailyInputAVGIncomeDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | NO |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | NO |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| SourceType | int | NO |  |

| DepartmentID | bigint | NO |  |

| ParentDepartmentID | bigint | YES |  |

| DepartmentName | varchar(100) | YES |  |

| DepartmentOrder | tinyint | YES |  |

| CreditAccountID | binary(18) | YES |  |

| RevAmount | decimal | NO |  |

| StatAmount | decimal | NO |  |

| PDepOrder | tinyint | YES |  |

## dbo.DailyInputGroupView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | YES |  |

| DeptName | nvarchar(100) | NO |  |

| Name | nvarchar(104) | YES |  |

| G1ID | binary(18) | NO |  |

| GName1 | nvarchar(100) | YES |  |

| G2ID | binary(18) | YES |  |

| GName2 | nvarchar(100) | YES |  |

| G3ID | binary(18) | YES |  |

| GName3 | nvarchar(100) | YES |  |

| ActualName | nvarchar(100) | YES |  |

| Status | smallint | YES |  |

| DeptType | smallint | YES |  |

| DeptID | binary(18) | NO |  |

| Order1 | nvarchar(363) | YES |  |

## dbo.DailyInputRoomStatisticsIncomeDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| Amount | decimal | YES |  |

| SourceType | int | NO |  |

| EnableADRORAVG | smallint | YES |  |

| CreditAccountID | binary(18) | YES |  |

| StatID | binary(18) | NO |  |

| ParentDepartmentID | bigint | YES |  |

| DepartmentID | bigint | NO |  |

| DepartmentName | varchar(100) | YES |  |

| DepartmentOrder | tinyint | YES |  |

## dbo.DailyInputSalesReportStatsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| TotalRoomsSold | decimal | YES |  |

| TotalRoomsAvailable | decimal | YES |  |

| TotalRoomsRevenue | decimal | YES |  |

| SaleDate | datetime2 | NO |  |

| CorporationID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

## dbo.DailyLineWithGroupDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | nvarchar(100) | YES |  |

| CreditAccountID | binary(18) | YES |  |

| DebitAccountID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| EnableADRORAVG | smallint | YES |  |

| EnableNegative | bit | YES |  |

| GroupID | binary(18) | YES |  |

| Order | bigint | YES |  |

| GroupName | nvarchar(100) | YES |  |

| GroupOrder | bigint | YES |  |

| GroupStatus | smallint | YES |  |

| Status | smallint | YES |  |

| ParentGroupName | nvarchar(100) | YES |  |

| ParentGroupOrder | bigint | YES |  |

| ParentGroupID | binary(18) | YES |  |

| ParentGroupStatus | smallint | YES |  |

| DepartmentID | binary(18) | YES |  |

| IncomeSubDepartmentID | bigint | YES |  |

| ParentIncomeSubDepartmentID | bigint | YES |  |

| StoreID | binary(18) | YES |  |

## dbo.DailySaleDefaults

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| GroupID | binary(18) | YES |  |

| DepartmentID | binary(18) | YES |  |

| DeptType | smallint | YES |  |

| Type | smallint | YES |  |

| DetailType | int | YES |  |

| LineID | binary(18) | YES |  |

| DepartmentName | varchar(100) | YES |  |

| ParentGroupName | varchar(100) | YES |  |

| GroupName | varchar(100) | YES |  |

| ItemName | varchar(100) | YES |  |

| ParentGroupOrder | int | YES |  |

| GroupOrder | int | YES |  |

| SourceType | smallint | YES |  |

| Order | bigint | YES |  |

| Description | varchar(2000) | YES |  |

| TargetDescription | varchar(2000) | YES |  |

| IsReadOnly | smallint | YES |  |

## dbo.DashBoardDetailSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| WidgetID | bigint | YES |  |

| CorporationID | binary(18) | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| DateFilterType | tinyint | YES |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| RowX | int | YES |  |

| ColX | int | YES |  |

| SizeX | int | YES |  |

| SizeY | int | YES |  |

| Visible | bit | YES |  |

| DefaultView | bit | YES |  |

| WidgetOrder | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.DashBoardSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| FeatureID | binary(18) | NO |  |

| RoleID | binary(18) | YES |  |

| ClientID | binary(18) | NO |  |

| Visible | bit | NO |  |

| DefaultView | bit | NO |  |

## dbo.DashBoardUserSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| WidgetID | bigint | YES |  |

| CorporationIDs | varchar(-1) | YES |  |

| ColumnSettings | varchar(200) | YES |  |

## dbo.DateDimensions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| EntryDate | datetime2 | NO |  |

| DMnth | int | YES |  |

| DName | varchar(50) | YES |  |

| Wk | int | YES |  |

| ISOWk | int | YES |  |

| DWk | int | YES |  |

| Mnth | int | YES |  |

| MnthName | varchar(50) | YES |  |

| MnthShortName | varchar(10) | YES |  |

| Qtr | int | YES |  |

| Yr | int | YES |  |

| FirstDayOfMonth | datetime2 | YES |  |

| LastDayOfMonth | datetime2 | YES |  |

| TheDayOfYear | int | YES |  |

| MonthYear | bigint | YES |  |

## dbo.DBUserDetailSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DBSettingsID | bigint | YES |  |

| CorporationID | binary(18) | YES |  |

| Status | smallint | YES |  |

## dbo.Department

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| StoreID | binary(18) | NO |  |

| Status | smallint | NO |  |

| ContactID | binary(18) | YES |  |

| AddressID | binary(18) | YES |  |

| ParentDepartmentID | binary(18) | YES |  |

## dbo.DepartmentFranchisee

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DepartmentID | binary(18) | NO |  |

| FranchiseeID | binary(18) | NO |  |

## dbo.DirectDepositAuditInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AuditID | bigint | NO |  |

| CorporationLegalName | varchar(100) | YES |  |

| BankName | varchar(500) | YES |  |

| OriginatorNo | varchar(50) | YES |  |

| DataCenterNo | varchar(10) | YES |  |

| UpdatedColumns | varchar(25) | YES |  |

## dbo.DirectDepositBankDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| BankAndPaymentsIn | tinyint | YES |  |

| CorpLegalName | varchar(100) | YES |  |

| CorpShortName | varchar(50) | YES |  |

| DDBankName | varchar(500) | YES |  |

| DDOriginatorNo | varchar(50) | YES |  |

| DDInstitutionNo | varchar(50) | YES |  |

| DDRoutingNo | varchar(50) | YES |  |

| DDAccountNo | varchar(50) | YES |  |

| DataCentreNo | varchar(10) | YES |  |

| ResFieldsForOrg | varchar(50) | YES |  |

| EleIdentification | varchar(50) | YES |  |

| SettlementCode | varchar(50) | YES |  |

| PayableTransCode | varchar(10) | YES |  |

| DDBankTemplate | tinyint | YES |  |

| Status | tinyint | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| CorpName | varchar(100) | YES |  |

| isAttached | smallint | YES |  |

| AttachedOn | datetime2 | YES |  |

| AttachedBy | binary(18) | YES |  |

| UpdatedOn | datetime2 | YES |  |

| UpdatedBy | binary(18) | YES |  |

| SignaturePath | varchar(500) | YES |  |

| DDType | tinyint | YES |  |

| IsActive | bit | YES |  |

## dbo.DirectDepositExportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| JournalEntryId | binary(18) | NO |  |

| TransactionId | binary(18) | NO |  |

| CorporationId | binary(18) | NO |  |

| AccountId | binary(18) | NO |  |

| BillAmt | decimal | NO |  |

| CreatedBy | binary(18) | YES |  |

| ExportedBy | binary(18) | YES |  |

| LastExportedBy | binary(18) | YES |  |

| CreationNum | varchar(10) | YES |  |

| ExportedCnt | int | YES |  |

| CreatedDate | date | YES |  |

| MultipleCreationNoDisplay | varchar(500) | YES |  |

| BID | bigint | NO |  |

| IsFromReport | int | NO | ((0)) |

| LatestCreatedDate | date | YES |  |

| Status | smallint | YES |  |

| EFTREFNumber | smallint | YES |  |

| RepayStatus | nvarchar(15) | YES | (NULL) |

| RepayBatchNo | nvarchar(10) | YES | (NULL) |

## dbo.DSAdjustmentAccountDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DSDepositID | varchar(200) | YES |  |

| ReqID | varchar(100) | YES |  |

| DSDate | datetime | YES |  |

| AccountID | binary(18) | YES |  |

## dbo.DSAdjustmentAccountDetailsTemp

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DSDepositInfoID | varchar(200) | YES |  |

| DepositInfoDetailsID | varchar(200) | YES |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| ReqID | varchar(100) | YES |  |

| DailyConfigInputID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| LineName | varchar(200) | YES |  |

## dbo.DSDepositInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DSDepositID | bigint | YES |  |

| DailyConfigInputID | binary(18) | YES |  |

| Difference | decimal | YES |  |

| Comments | varchar(500) | YES |  |

| IsFromEdit | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.DSDepositInfoDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DSDepositInfoID | bigint | YES |  |

| DailySalesReceiptID | binary(18) | YES |  |

| SaleDate | datetime | YES |  |

| LineID | binary(18) | YES |  |

| LineName | varchar(50) | YES |  |

| Amount | decimal | YES |  |

| LineOrder | int | YES |  |

| DisplayOrder | int | YES |  |

| IsEditable | smallint | YES |  |

| RowSet | int | YES |  |

| Status | smallint | YES |  |

| AccountID | binary(18) | YES |  |

| JournalEntryID | binary(18) | YES |  |

## dbo.DSDeposits

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| DepositDate | datetime2 | YES |  |

| Memo | varchar(500) | YES |  |

| TotalAmount | decimal | YES |  |

| TotalDeposited | decimal | YES |  |

| Difference | decimal | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedOn | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| IsAttachment | smallint | YES |  |

| ReqID | varchar(100) | YES |  |

| AttachmentID | binary(18) | YES |  |

| Status | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| ApprovedBy | binary(18) | YES |  |

| ApprovedDate | datetime2 | YES |  |

| AssignedTo | binary(18) | YES |  |

| ApprovalLevel | smallint | YES |  |

| ApprovalStatus | smallint | YES |  |

## dbo.DSDepositsInfoDetailsTemp

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DSDepositInfoID | int | YES |  |

| DailySalesReceiptID | binary(18) | YES |  |

| SaleDate | datetime | YES |  |

| LineID | binary(18) | YES |  |

| LineName | varchar(50) | YES |  |

| Amount | decimal | YES |  |

| LineOrder | int | YES |  |

| DisplayOrder | int | YES |  |

| IsEditable | smallint | YES |  |

| RowSet | int | YES |  |

| Status | smallint | YES |  |

| AccountID | binary(18) | YES |  |

| JournalEntryID | binary(18) | YES |  |

## dbo.DSDepositsInfoTemp

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| DSDepositID | int | YES |  |

| DailyConfigInputID | binary(18) | YES |  |

| Difference | decimal | YES |  |

| Comments | varchar(500) | YES |  |

| IsFromEdit | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.DSDepositsTemp

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| DepositDate | datetime2 | YES |  |

| Memo | varchar(500) | YES |  |

| TotalAmount | decimal | YES |  |

| TotalDeposited | decimal | YES |  |

| Difference | decimal | YES |  |

| IsAttachment | smallint | YES |  |

| ReqID | varchar(100) | YES |  |

| AttachmentID | binary(18) | YES |  |

| Status | smallint | YES |  |

| StoreID | binary(18) | YES |  |

## dbo.Dummy_BudgetAssumptionDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| IntermID | binary(18) | YES |  |

| GroupID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AssumptionID | bigint | YES |  |

| DependentAccountID | binary(18) | YES |  |

| ColumnNo | int | YES |  |

| AmountStatistics | decimal | YES |  |

| Shifts | decimal | YES |  |

| Minutes | decimal | YES |  |

| Hours | decimal | YES |  |

| Wages | decimal | YES |  |

| Amount | decimal | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| RequestID | varchar(200) | YES |  |

## dbo.Dummy_BudgetDetailAssumptionAccounts

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AssumptionID | bigint | YES |  |

| AccountID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| Statistics | decimal | NO |  |

| RequestID | varchar(100) | NO |  |

| MainAccountID | binary(18) | NO |  |

| GroupID | binary(18) | NO |  |

| IntermID | binary(18) | NO |  |

| Type | smallint | YES |  |

## dbo.Dummy_DailyImport

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Date | datetime2 | YES |  |

| ItemID | binary(18) | YES |  |

| Debit | decimal | YES |  |

| Credit | decimal | YES |  |

| RequestID | varchar(250) | YES |  |

| IsStat | bit | YES |  |

## dbo.Dummy_DailyImportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| MappingId | bigint | NO |  |

| AccountDescription | varchar(250) | YES |  |

| ItemDescription | varchar(250) | YES |  |

| LineId | binary(18) | YES |  |

| Order | int | YES |  |

| IsLineMapped | bit | YES |  |

| MapLineID | binary(18) | YES |  |

| Signs | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.Dummy_DailyImportMapp

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationId | binary(18) | NO |  |

| Status | smallint | YES |  |

| RequestID | varchar(250) | YES |  |

## dbo.Dummy_ReconcileTransactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReconciliationID | binary(18) | YES |  |

| TransactionID | binary(18) | YES |  |

| IsSelect | bit | YES |  |

| RequestID | varchar(250) | YES |  |

| IsBankTransactionRefId | tinyint | YES |  |

## dbo.dummy20230304

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| InvoiceID | binary(18) | YES |  |

| Hrs | decimal | YES |  |

| Rate | decimal | YES |  |

| TaxRate | decimal | YES |  |

| SourceID | binary(18) | YES |  |

| Status | tinyint | YES |  |

| AccContractID | binary(18) | YES |  |

| BaseDebitCredit | bit | YES |  |

## dbo.DummyBillEntryDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalID | binary(18) | YES |  |

| RequestID | varchar(250) | YES |  |

| AccountID | binary(18) | YES |  |

| Description | varchar(450) | YES |  |

| Amount | decimal | YES |  |

| RowCount | int | YES |  |

| GridNO | int | YES |  |

| BillNum | varchar(50) | YES |  |

| SavedJournalID | binary(18) | YES |  |

## dbo.DummyCOA_Config

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| IncomeConfigID | bigint | YES |  |

| PLGroupID | binary(18) | YES |  |

| BudgetGroupID | binary(18) | YES |  |

| BSGroupID | bigint | YES |  |

| CorporationID | binary(18) | YES |  |

| DepartmentID | bigint | YES |  |

| DepartmentName | varchar(200) | YES |  |

| SubDepID | bigint | YES |  |

| SubDepName | varchar(200) | YES |  |

| GroupID | varchar(200) | YES |  |

| GroupName | varchar(200) | YES |  |

| SubGroup1ID | varchar(200) | YES |  |

| SubGroupName1 | varchar(200) | YES |  |

| SubGroup2ID | varchar(200) | YES |  |

| SubGroupName2 | varchar(200) | YES |  |

| ParollItemType | smallint | YES |  |

| HoursType | smallint | YES |  |

| AccountID | binary(18) | YES |  |

| Type | smallint | YES |  |

| PurposeType | smallint | YES |  |

| ReqID | varchar(-1) | YES |  |

| ConfigDetailsID | bigint | YES |  |

| PLGroupDetailsID | binary(18) | YES |  |

## dbo.DummyDailyConfigInputEntry

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DailyInputID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModofiedBy | binary(18) | YES |  |

| ModifiedDate | datetime2 | YES |  |

| ApprovedBy | binary(18) | YES |  |

| ApprovedDate | datetime2 | YES |  |

| RequestID | varchar(250) | YES |  |

| StoreID | binary(18) | YES |  |

| Weather | nvarchar(100) | YES | (NULL) |

## dbo.DummyDailyConfigInputEntry_ARReceipt

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DID | binary(18) | YES |  |

| DailyConfigInputID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Amount | decimal | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| RequestID | varchar(250) | YES |  |

| CreditRefID | binary(18) | YES |  |

| DebitRefID | binary(18) | YES |  |

| CAAcoountID | binary(18) | YES |  |

| DAAccountID | binary(18) | YES |  |

## dbo.DummyDailyConfigInputEntry_RevStat

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DID | binary(18) | YES |  |

| DailyConfigInputID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| Order | int | YES |  |

| RequestID | varchar(250) | YES |  |

| CreditRefID | binary(18) | YES |  |

| DebitRefID | binary(18) | YES |  |

| CAccountID | binary(18) | YES |  |

| DAccountID | binary(18) | YES |  |

## dbo.DummyDailyConfigInputEntry_RevStatDet

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DID | binary(18) | YES |  |

| DConfigIERevID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| Order | int | YES |  |

| RequestID | varchar(250) | YES |  |

| LineID | binary(18) | YES |  |

| Description | varchar(50) | YES |  |

| RefID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| DrRefID | binary(18) | YES |  |

## dbo.DummyPMSCorpMappingDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| PMSCorpMappingId | bigint | NO |  |

| PMSMappingId | bigint | YES |  |

| LineId | binary(18) | YES |  |

| Order | int | YES |  |

| AccountID | varchar(100) | YES |  |

| AccountDescription | varchar(250) | YES |  |

| PMSCurrencyType | varchar(50) | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| SEQ | varchar(50) | YES |  |

| DebitCreditMapping | smallint | YES |  |

| TransactionType | varchar(250) | YES |  |

| DeptType | smallint | YES |  |

| DepartmentID | binary(18) | YES |  |

| Debit | decimal | YES |  |

| Credit | decimal | YES |  |

| CGS | decimal | YES |  |

| Amount | decimal | YES |  |

| RequestID | varchar(250) | YES |  |

| IsEnding | smallint | YES |  |

## dbo.DummySingleBinaryCarrier

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReqID | uniqueidentifier | NO |  |

| JournalEntryID | binary(18) | YES |  |

## dbo.DWTransactionDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DebitCredit | bit | YES |  |

| Amount | decimal | YES |  |

| CorporationID | binary(18) | YES |  |

| EntryDate | datetime2 | YES |  |

| AccountID | binary(18) | YES |  |

| AccountName | varchar(250) | YES |  |

| AccountNumber | varchar(100) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| ParentAccountTypeID | binary(18) | YES |  |

| SourceType | smallint | NO |  |

| StoreID | binary(18) | YES |  |

| TransID | binary(18) | YES |  |

| Statstics | decimal | YES |  |

## dbo.DWTransactionMonthWiseDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | YES |  |

| AccountName | varchar(250) | YES |  |

| AccountNumber | varchar(100) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| DebitCredit | bit | YES |  |

| Amount | decimal | YES |  |

| Mnth | int | YES |  |

| Yr | int | YES |  |

| Statstics | decimal | NO |  |

| MonthYear | bigint | YES |  |

| SourceType | smallint | NO |  |

| ParentAccountTypeID | binary(18) | YES |  |

| EntryDate | datetime2 | YES |  |

| CorporationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| TransID | binary(18) | YES |  |

## dbo.DWTransactionSplitDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| SplitAccountName | varchar(250) | YES |  |

| TransID | binary(18) | YES |  |

## dbo.EFTAuditInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AuditID | bigint | NO |  |

| FormatName | varchar(250) | YES |  |

| IsColumnUpdated | bit | YES |  |

## dbo.EFTColumns

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(250) | YES |  |

| Order | smallint | YES |  |

| Type | tinyint | YES |  |

| Status | tinyint | YES |  |

## dbo.EFTConfig

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Status | tinyint | YES |  |

| EFTFormatID | bigint | YES |  |

## dbo.EFTExportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| JournalEntryId | binary(18) | NO |  |

| TransactionId | binary(18) | NO |  |

| CorporationId | binary(18) | NO |  |

| AccountId | binary(18) | NO |  |

| BillAmt | decimal | NO |  |

| CreatedBy | binary(18) | YES |  |

| ExportedBy | binary(18) | YES |  |

| BatchNum | varchar(10) | YES |  |

| ExportedCnt | int | YES |  |

| CreatedDate | date | YES |  |

| EID | bigint | NO |  |

| IsFromReport | int | NO | ((0)) |

| MainUserID | binary(18) | YES |  |

## dbo.EFTFormat

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(250) | YES |  |

| Status | smallint | YES |  |

| ClientId | binary(18) | YES |  |

## dbo.EFTFormatDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EFTFormatID | bigint | NO |  |

| EFTColumnID | bigint | NO |  |

| ColumnNameCust | varchar(250) | YES |  |

| ExcelCol | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.EftrpPayment

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DateFrom | date | NO |  |

| DateTo | date | NO |  |

## dbo.EmpAndOtherTransactionsList

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| TransNumber | int | YES |  |

| EntryDate | datetime2 | NO |  |

| Number | varchar(100) | YES |  |

| Amount | decimal | YES |  |

| AccountName | varchar(127) | YES |  |

| CLR | varchar(1) | NO |  |

| CorporationName | varchar(100) | NO |  |

| StoreName | varchar(50) | YES |  |

| StoreID | binary(18) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Memo | varchar(500) | YES |  |

| DueDate | datetime2 | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| Balance | decimal | NO |  |

| DebitCredit | bit | NO |  |

| TransID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| FranchiseeName | varchar(50) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| TSourceID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AccountStatus | tinyint | NO |  |

| AccountTypeID | binary(18) | NO |  |

| BankType | varchar(1) | NO |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TSourceType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransactionDate | datetime2 | NO |  |

| Order | smallint | YES |  |

| JESourceID | binary(18) | YES |  |

| Name | varchar(100) | NO |  |

| Debit | decimal | NO |  |

| Credit | decimal | NO |  |

| VoidDate | datetime2 | YES |  |

## dbo.EmpIncomeTimeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| ItemID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| BillingRate | decimal | YES |  |

| Billable | bit | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| TimeInfoID | binary(18) | NO |  |

## dbo.Employee

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| FirstName | varchar(100) | NO |  |

| LastName | varchar(50) | YES | (NULL) |

| SSN | varchar(16) | YES | (NULL) |

| AddressID | binary(18) | YES | (NULL) |

| ContactID | binary(18) | YES | (NULL) |

| CorporationID | binary(18) | NO |  |

| Status | smallint | YES | (NULL) |

| AvailableStatus | bit | YES | (0x01) |

| Type | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| RefInfo | decimal | YES |  |

| MapID | binary(18) | YES |  |

## dbo.EmployeeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Salutation | tinyint | YES |  |

| MiddleName | varchar(50) | YES |  |

| Gender | tinyint | YES |  |

| DOB | datetime | YES |  |

| MaritalStatus | smallint | YES |  |

| CheckTobePrintedAs | varchar(100) | YES |  |

| BankAccountNum | varchar(50) | YES |  |

| BankID | binary(18) | YES |  |

| RelationID | binary(18) | YES |  |

| RelationContactID | binary(18) | YES |  |

| FrequencyID | binary(18) | YES |  |

| PayrollStartDate | varchar(5) | YES |  |

| HireDate | datetime2 | YES |  |

| StartDate | datetime2 | YES |  |

| JobEndDate | datetime2 | YES |  |

| ReleaseDate | datetime2 | YES |  |

| JobID | binary(18) | YES |  |

| JobDescription | varchar(100) | YES |  |

| TerminationType | tinyint | YES |  |

| TerminationReason | varchar(100) | YES |  |

| LastDayWorked | datetime2 | YES |  |

| Billable | bit | YES |  |

| LCAState | decimal | YES |  |

| LCAGC | decimal | YES |  |

| IsPensionPlanCovered | bit | YES |  |

| IsTimesheetInfoUsed | bit | YES |  |

| SickHrs | varchar(100) | YES |  |

| SickDays | int | YES |  |

| SickDate | datetime2 | YES |  |

| VacationHrs | varchar(10) | YES |  |

| Vacationdays | int | YES |  |

| vacationdate | datetime2 | YES |  |

| FederalFillingStatusID | tinyint | YES |  |

| FederalAllowances | decimal | YES |  |

| FederalWithHolding | decimal | YES |  |

| StateWorkedID | bigint | YES |  |

| StateWithHoldingID | bigint | YES |  |

| StateAllowances | decimal | YES |  |

| StateWithHolding | decimal | YES |  |

| ISStateSUI | bit | YES |  |

| IsStateSDI | bit | YES |  |

| IsLivingSUI | bit | YES |  |

| IsLivingSDI | bit | YES |  |

| IsMedicare | bit | YES |  |

| IsSocialSecurity | bit | YES |  |

| IsAdvanceIncomeCredit | bit | YES |  |

| IsFederalUnempTax | bit | YES |  |

| Note | varchar(500) | YES |  |

| IsUSCitizen | bit | YES |  |

| IsI9onfile | bit | YES |  |

| I9ExpirationDate | datetime2 | YES |  |

| JobType | tinyint | YES |  |

| WorkingMaritalStatus | int | YES |  |

| StateMaritalStatus | int | YES |  |

| StatePersonalExemptions | varchar(10) | YES |  |

| StateDependentExemptions | decimal | YES |  |

| StateNoofExemoptions | decimal | YES |  |

| WorkPersonalExemptions | varchar(10) | YES |  |

| WorkDependentExemptions | decimal | YES |  |

| WorkNoofExemoptions | decimal | YES |  |

| RateCode | varchar(3) | YES |  |

| WorkAnnualCompensation | varchar(8) | YES |  |

| StateAnnualCompensation | varchar(8) | YES |  |

| WorkExtraWithholding | decimal | YES |  |

| WorkAllowances | decimal | YES |  |

| PayrollDepartmentID | binary(18) | YES |  |

## dbo.EmployeeLCAHistory

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EmployeeID | binary(18) | NO |  |

| StateID | bigint | YES |  |

| Amount | decimal | NO |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| type | tinyint | NO |  |

| Status | tinyint | NO |  |

## dbo.EmployeePayRate

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ItemID | binary(18) | NO |  |

| PayRate | decimal | NO |  |

| PerDiem | bit | YES |  |

| Status | tinyint | NO |  |

## dbo.EmployeePayrollDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| SourceType | smallint | NO |  |

| ItemID | binary(18) | NO |  |

| Amount | decimal | YES |  |

| LimitAmount | decimal | YES |  |

| Rate | decimal | YES |  |

| PerDiem | bit | YES |  |

| Status | tinyint | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| CostCenterID | binary(18) | YES |  |

| Order | tinyint | NO |  |

| Type | smallint | YES |  |

## dbo.EmployeeTaxMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| PayrollItemID | binary(18) | YES |  |

| TaxID | int | YES |  |

| Limit | decimal | YES |  |

| StateID | bigint | YES |  |

| Status | smallint | YES |  |

## dbo.EmployeeTimeSheetSend

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| TimeSheetID | binary(18) | YES |  |

| EmployeeID | binary(18) | NO |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| Status | tinyint | YES |  |

| SourceType | tinyint | YES |  |

| ResourceID | binary(18) | YES |  |

## dbo.EmployemntVisaDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| VisaID | binary(18) | NO |  |

| Description | varchar(50) | YES |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| Status | tinyint | NO |  |

| Order | tinyint | NO |  |

## dbo.EmpOtherProfTimeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| ItemID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| BillingRate | decimal | YES |  |

| PayRate | decimal | NO |  |

| Billable | bit | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| PerDiem | decimal | YES |  |

## dbo.EmpOtherProfTimeDetailsMonthWise

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| ItemID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| BillingRate | decimal | YES |  |

| PayRate | decimal | NO |  |

| Billable | bit | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| PerDiem | decimal | YES |  |

## dbo.EmpTimeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| ItemID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| BillingRate | decimal | YES |  |

| PayRate | decimal | NO |  |

| Billable | bit | NO |  |

## dbo.EmpTimePayRollDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| ItemID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| PayRate | decimal | NO |  |

| Billable | bit | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| ActPayRate | decimal | YES |  |

## dbo.EntityUsage

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EntityID | binary(18) | NO |  |

| EntityType | smallint | YES |  |

| ExternalEntityID | smallint | YES |  |

| IsDeleted | bit | YES |  |

| CreatedDate | datetime2 | YES |  |

| Status | smallint | YES |  |

## dbo.EPayLogTempTable

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Id | bigint | NO |  |

| CorporationId | varchar(2000) | YES |  |

| BatchId | varchar(2000) | YES |  |

| PaymentType | int | YES |  |

| StartDate | datetime | YES |  |

| EndDate | datetime | YES |  |

## dbo.EPaymentLogInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EPayBatchDetailId | bigint | YES |  |

| EPayBatchDetailStatus | smallint | YES |  |

| EPayBatchStatus | smallint | YES |  |

| JournalEntryId | binary(18) | YES |  |

| TransactionId | binary(18) | YES |  |

| Amount | decimal | YES |  |

| ActionType | smallint | YES |  |

| Status | smallint | YES |  |

| CreatedDate | datetime2 | YES |  |

| CreatedBy | binary(18) | NO |  |

| ModifiedDate | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| LogInfo | varchar(750) | YES |  |

## dbo.EPaymentsBatch

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BatchNumber | bigint | NO |  |

| IntiationDate | datetime2 | NO |  |

| AssignedTo | binary(18) | YES |  |

| IssuedCount | smallint | YES |  |

| Status | smallint | NO |  |

| ApprovalLevel | smallint | NO |  |

| CreatedDate | datetime2 | NO |  |

| CreatedBy | binary(18) | NO |  |

| ModifiedDate | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| FormatId | bigint | YES |  |

| BatchIssueID | bigint | YES |  |

| DDType | int | YES |  |

## dbo.EPaymentsBatchDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EPaymentsBatchID | bigint | YES |  |

| JournalEntryID | binary(18) | YES |  |

| TransactionID | binary(18) | YES |  |

| Amount | decimal | NO |  |

| Status | smallint | NO |  |

| CreatedDate | datetime2 | NO |  |

| CreatedBy | binary(18) | NO |  |

| ModifiedDate | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| VendorID | binary(18) | YES |  |

| EntryDate | datetime2 | YES |  |

| Number | varchar(50) | YES |  |

| PaymentID | varchar(100) | YES |  |

| PaymentGroupID | varchar(100) | YES |  |

| PaymentGroupName | varchar(100) | YES |  |

| PaymentMethodType | varchar(50) | YES |  |

| PaymentStatus | varchar(50) | YES |  |

| PaymentTime | datetime | YES |  |

| IssuedCount | smallint | YES |  |

| REFNumber | varchar(50) | YES |  |

| VocherLink | varchar(1000) | YES |  |

| CheckImageLink | varchar(1000) | YES |  |

| VendorRefId | varchar(30) | YES |  |

## dbo.EPaymentsBatchLog

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EPaymentsBatchID | bigint | YES |  |

| ActionType | smallint | YES |  |

| Status | smallint | YES |  |

| CreatedDate | datetime2 | NO |  |

| CreatedBy | binary(18) | NO |  |

| ModifiedDate | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| LogInfo | varchar(750) | YES |  |

## dbo.EPaymentsBatchVoidDeleteLog

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EBatchLogID | bigint | YES |  |

| JournalEntryID | binary(18) | YES |  |

| TransactionID | binary(18) | YES |  |

| Status | smallint | YES |  |

| IssuedCount | smallint | YES |  |

## dbo.FortePaymentsSchedule

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | smallint | NO |  |

| Amount | decimal | NO |  |

| BusinessTokenID | bigint | NO |  |

| Status | smallint | YES |  |

| RefID | binary(18) | YES |  |

| RefType | smallint | YES |  |

| PayToken | varchar(200) | YES |  |

| Date | datetime2 | YES |  |

| Type | smallint | YES |  |

| TransactionID | varchar(100) | YES |  |

| IsFromAutoPayments | bit | YES |  |

| TargetID | binary(18) | YES |  |

| ForteStatus | varchar(500) | YES |  |

| AuthCode | varchar(50) | YES |  |

| RemindmeBeforeMail | varchar(500) | YES |  |

| RemindmeBefore | int | YES |  |

| Number | varchar(50) | YES |  |

## dbo.FortePaymentTokens

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Token | varchar(200) | YES |  |

| BusinessTokenID | bigint | YES |  |

| Status | smallint | YES |  |

| IsDefault | bit | YES |  |

| Type | smallint | YES |  |

| Number | varchar(50) | YES |  |

| AccountCardType | varchar(100) | YES |  |

## dbo.Franchisee

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| FranchiseeName | varchar(50) | NO |  |

| Status | smallint | YES | (NULL) |

## dbo.FranchiseeMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| FranchiseeID | binary(18) | NO |  |

| ClientID | binary(18) | NO |  |

| ID | binary(18) | NO |  |

| Status | smallint | YES |  |

## dbo.FranchiseeProduct

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Status | smallint | NO |  |

| ParentID | binary(18) | YES | (NULL) |

| FranchiseeMappingID | binary(18) | NO |  |

## dbo.Frequency

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Type | smallint | NO |  |

| Interval | smallint | NO |  |

| Status | smallint | NO |  |

| ClientID | binary(18) | YES | (NULL) |

| IsDefault | bit | YES |  |

| FrequencyType | smallint | YES |  |

| Optional | bit | YES |  |

## dbo.GeneralLedger

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| TransactionDate | datetime2 | NO |  |

| TransNumber | int | YES |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| Memo | varchar(500) | YES |  |

| TransID | binary(18) | NO |  |

| CorporationName | varchar(100) | NO |  |

| CorporationID | binary(18) | NO |  |

| JESourceID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| StoreName | varchar(50) | YES |  |

| FranchiseeName | varchar(50) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| AccountID | binary(18) | NO |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TransType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Name | varchar(151) | YES |  |

| PurposeName | varchar(201) | YES |  |

| SplitAccountName | varchar(127) | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransSourceID | binary(18) | YES |  |

| CreatedByUser | varchar(101) | YES |  |

| ModifiedByUser | varchar(101) | YES |  |

| ParentAccountTypeID | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedBy | binary(18) | YES |  |

## dbo.GeneralLedgerTrans

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| TransactionDate | datetime2 | NO |  |

| TransNumber | int | YES |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| Memo | varchar(500) | YES |  |

| TransID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| JESourceID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| AccountID | binary(18) | NO |  |

| PurposeID | binary(18) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| StoreName | varchar(50) | YES |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | int | YES |  |

| ParentID | binary(18) | YES |  |

| TransType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Name | varchar(151) | YES |  |

| PurposeName | varchar(201) | YES |  |

| SplitAccountName | varchar(127) | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransSourceID | binary(18) | YES |  |

| CreatedByUser | varchar(101) | YES |  |

| ModifiedByUser | varchar(101) | YES |  |

| ParentAccountTypeID | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| TOrder | smallint | NO |  |

| VoidDate | datetime2 | YES |  |

## dbo.GeneralLedgerTransUpdated

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| TransactionDate | datetime2 | NO |  |

| TransNumber | int | YES |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| Memo | varchar(500) | YES |  |

| TransID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| JESourceID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| AccountID | binary(18) | YES |  |

| PurposeID | binary(18) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| StoreName | varchar(50) | YES |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | int | YES |  |

| ParentID | binary(18) | YES |  |

| TransType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Name | varchar(151) | YES |  |

| PurposeName | varchar(100) | YES |  |

| SplitAccountName | int | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransSourceID | binary(18) | YES |  |

| CreatedByUser | varchar(101) | YES |  |

| ModifiedByUser | varchar(101) | YES |  |

| ParentAccountTypeID | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| AccountTypeID | binary(18) | NO |  |

| VoidDate | datetime2 | YES |  |

| VAccountNumber | varchar(20) | YES |  |

| IsDualBrand | bit | NO |  |

| SourceTypeID | smallint | YES |  |

## dbo.GeneralLedgerUnApproveTrans

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EntryDate | datetime2 | YES |  |

| TransactionDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| Amount | decimal | YES |  |

| DebitCredit | bit | YES |  |

| Memo | varchar(500) | YES |  |

| TransID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| JESourceID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryNumber | varchar(50) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| AccountID | binary(18) | YES |  |

| PurposeID | binary(18) | YES |  |

| StoreName | varchar(50) | YES |  |

| ParentID | binary(18) | YES |  |

| TransType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| Name | varchar(151) | YES |  |

| PurposeName | varchar(201) | YES |  |

| SplitAccountName | varchar(127) | YES |  |

| TransStatus | smallint | YES |  |

| JournalStatus | int | YES |  |

| TransSourceID | binary(18) | YES |  |

| CreatedByUser | varchar(101) | YES |  |

| ModifiedByUser | varchar(101) | YES |  |

| ParentAccountTypeID | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| ReferencedID | binary(18) | YES |  |

| TOrder | smallint | NO |  |

## dbo.GeneralLedgerUnApproveTransUpdated

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EntryDate | datetime2 | YES |  |

| BillDate | datetime2 | YES |  |

| TransactionDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| Amount | decimal | YES |  |

| DebitCredit | bit | YES |  |

| Memo | varchar(500) | YES |  |

| TransID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| JESourceID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryNumber | varchar(50) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| AccountID | binary(18) | YES |  |

| PurposeID | binary(18) | YES |  |

| StoreName | varchar(50) | YES |  |

| ParentID | binary(18) | YES |  |

| TransType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| Name | varchar(151) | YES |  |

| PurposeName | varchar(100) | YES |  |

| SplitAccountName | int | YES |  |

| TransStatus | smallint | YES |  |

| JournalStatus | int | YES |  |

| TransSourceID | binary(18) | YES |  |

| CreatedByUser | varchar(101) | YES |  |

| ModifiedByUser | varchar(101) | YES |  |

| ParentAccountTypeID | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| ReferencedID | binary(18) | YES |  |

| VAccountNumber | varchar(20) | YES |  |

| IsDualBrand | bit | YES |  |

## dbo.GetDailyInputADRDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(104) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | NO |  |

| LineName | nvarchar(104) | YES |  |

| LineOrder | bigint | YES |  |

| AMOUNT | decimal | YES |  |

| Qty | decimal | NO |  |

| RevAmount | decimal | YES |  |

| SourceType | int | NO |  |

| CreditAccountID | binary(18) | YES |  |

| EnableADRORAVG | smallint | YES |  |

## dbo.GetDailyInputARCityLedgerView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | int | YES |  |

| DeptName | varchar(22) | NO |  |

| Type | int | YES |  |

| DeptType | int | NO |  |

| GrpID | int | YES |  |

| GrpName | int | YES |  |

| GrpOrder | int | YES |  |

| GrID | int | YES |  |

| GrName | int | YES |  |

| GrOrder | int | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | varchar(200) | YES |  |

| LineOrder | smallint | YES |  |

| Amount | decimal | YES |  |

| SourceType | smallint | YES |  |

| DebitAccountID | int | YES |  |

| LkpupSrcType | smallint | YES |  |

| LkpupOrder | smallint | YES |  |

## dbo.GetDailyInputARDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| Amount | decimal | YES |  |

| SourceType | smallint | YES |  |

| DebitAccountID | binary(18) | YES |  |

| CreditAccountID | binary(18) | YES |  |

## dbo.GetDailyInputAVGDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(107) | YES |  |

| LineOrder | bigint | YES |  |

| AMOUNT | decimal | YES |  |

| SourceType | int | NO |  |

| GrpDeptID | bigint | YES |  |

| GrDeptID | bigint | YES |  |

| CreditAccountID | binary(18) | YES |  |

| RevAmount | decimal | YES |  |

| StatAmount | decimal | YES |  |

## dbo.GetDailyInputReceiptDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| Amount | decimal | YES |  |

| SourceType | smallint | YES |  |

| DebitAccountID | binary(18) | YES |  |

| CreditAccountID | binary(18) | YES |  |

| CashID | binary(18) | NO |  |

## dbo.GetDailyInputRevenueDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| Amount | decimal | YES |  |

| SourceType | int | NO |  |

| EnableADRORAVG | smallint | YES |  |

| CreditAccountID | binary(18) | YES |  |

| RevID | binary(18) | NO |  |

| StoreID | binary(18) | YES |  |

## dbo.GetDailyInputStatisticsDetailsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DeptID | binary(18) | NO |  |

| DeptName | nvarchar(100) | NO |  |

| Type | smallint | YES |  |

| DeptType | smallint | YES |  |

| GrpID | binary(18) | YES |  |

| GrpName | nvarchar(100) | YES |  |

| GrpOrder | bigint | YES |  |

| GrID | binary(18) | YES |  |

| GrName | nvarchar(100) | YES |  |

| GrOrder | bigint | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| SaleDate | datetime2 | NO |  |

| Status | smallint | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| LineOrder | bigint | YES |  |

| Amount | decimal | YES |  |

| SourceType | int | NO |  |

| EnableADRORAVG | smallint | YES |  |

| GrpDeptID | bigint | YES |  |

| grDeptID | bigint | YES |  |

| CreditAccountID | binary(18) | YES |  |

| StatID | binary(18) | NO |  |

| RoomType | smallint | YES |  |

| StoreID | binary(18) | YES |  |

## dbo.GL

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GLNo | varchar(15) | NO |  |

| SourceID | binary(18) | NO |  |

| SortOrder | tinyint | NO |  |

| Formula | varchar(-1) | YES |  |

| Status | tinyint | YES | (NULL) |

| GLName | varchar(100) | YES | (NULL) |

## dbo.GLNumberSettingDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GlSettingsID | binary(18) | NO |  |

| AccountID | binary(18) | NO |  |

| Status | smallint | YES |  |

| Order | smallint | YES |  |

## dbo.GLNumberSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| PCID | binary(18) | NO |  |

| GLNoID | binary(18) | YES |  |

| Status | smallint | YES |  |

## dbo.GSSCommentConfiguration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| GSSConfigurationID | bigint | YES |  |

| SourceType | smallint | YES |  |

| FileColumnOrKeyword | varchar(100) | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

## dbo.GSSCommentConfigurationClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| GSSConfigurationID | bigint | YES |  |

| SourceType | smallint | YES |  |

| FileColumnOrKeyword | varchar(100) | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

## dbo.GSSCommentsImportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| GSSConfigImportID | bigint | YES |  |

| CommentConfigID | bigint | YES |  |

| CommentID | bigint | YES |  |

| XMLFilePath | varchar(500) | YES |  |

| CommentCount | bigint | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

## dbo.GSSConfigImport

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| ScoreFilePath | varchar(200) | YES |  |

| CommentsFilePath | varchar(200) | YES |  |

| ImportDate | datetime2 | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| StoreID | binary(18) | YES |  |

## dbo.GSSConfiguration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| Status | smallint | YES |  |

| IsForAllCorps | bit | YES |  |

| MapID | bigint | YES |  |

| StoreID | binary(18) | YES |  |

## dbo.GSSConfigurationClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Status | smallint | YES |  |

| IsForAllCorps | bit | YES |  |

## dbo.GSSScoreConfiguration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| GSSConfigurationID | bigint | YES |  |

| Heading | varchar(200) | YES |  |

| DataField | varchar(200) | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| SampleSize | smallint | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

## dbo.GSSScoreConfigurationClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| GSSConfigurationID | bigint | YES |  |

| Heading | varchar(200) | YES |  |

| DataField | varchar(200) | YES |  |

| Status | smallint | YES |  |

| Order | int | YES |  |

| SampleSize | smallint | YES |  |

## dbo.GSSScoreImportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| GSSConfigImportID | bigint | YES |  |

| ScoreConfigID | bigint | YES |  |

| Week1 | decimal | YES |  |

| Week2 | decimal | YES |  |

| Week3 | decimal | YES |  |

| Week4 | decimal | YES |  |

| Week5 | decimal | YES |  |

| Total | decimal | YES |  |

| Week1SampleSize | int | YES |  |

| Week2SampleSize | int | YES |  |

| Week3SampleSize | int | YES |  |

| Week4SampleSize | int | YES |  |

| Week5SampleSize | int | YES |  |

| TotalSampleSize | int | YES |  |

| Order | int | YES |  |

| Benchmark | decimal | YES |  |

| BenchmarkSampleSize | int | YES |  |

## dbo.ImportDocument

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| JournalEntryID | binary(18) | YES |  |

| FolderPath | varchar(1000) | YES |  |

| Status | smallint | YES |  |

| CorporationID | binary(18) | YES |  |

| TypeName | varchar(250) | YES |  |

## dbo.ImportDocumentDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| ImportDocumentID | int | YES |  |

| FileName | varchar(500) | YES |  |

| FileSize | varchar(50) | YES |  |

| Status | smallint | YES |  |

## dbo.IncCusColPref

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| IncomeStmtCustID | bigint | YES |  |

| IsPTDQTDSel | bit | YES |  |

| IsPTDQTD | smallint | YES |  |

| LastYear | bigint | YES |  |

| LY | bit | YES |  |

| LYVar | bit | YES |  |

| LYPerVar | bit | YES |  |

| YTDLY | bit | YES |  |

| YTDLYVar | bit | YES |  |

| YTDLYPerVar | bit | YES |  |

| BudLY | bit | YES |  |

| BudLYVar | bit | YES |  |

| BudLYPerVar | bit | YES |  |

| FCLY | bit | YES |  |

| FCLYVar | bit | YES |  |

| FCLYPerVar | bit | YES |  |

| PerInc | bit | YES |  |

| POR | bit | YES |  |

| PORVar | bit | YES |  |

| PORPerVar | bit | YES |  |

| PAR | bit | YES |  |

| PARVar | bit | YES |  |

| PARPerVar | bit | YES |  |

## dbo.IncCusDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| IncomeStmtCustID | bigint | YES |  |

| RptType | smallint | YES |  |

| RptTypeDefault | smallint | YES |  |

| AccType | smallint | YES |  |

| AccTypeDefault | smallint | YES |  |

| ColByType | smallint | YES |  |

| ColByTypeDefault | smallint | YES |  |

| EnableDateHeader | bit | YES |  |

| IsDynamicCol | bit | YES |  |

| ActualDays | int | YES |  |

| MonthType | smallint | YES |  |

| FCMonths | smallint | YES |  |

| DateRange | smallint | YES |  |

| IsCorpLegalName | bit | YES |  |

| IsNetIncSepPage | bit | YES |  |

| PerIncType | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.IncomeGroupView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| IncomeNameOrder | varchar(255) | YES |  |

| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | varchar(56) | YES |  |

| ActualName | varchar(50) | YES |  |

| Status | smallint | YES |  |

| I2ID | bigint | YES |  |

| I3ID | bigint | YES |  |

| I4ID | bigint | YES |  |

| I5ID | bigint | YES |  |

| IName2 | varchar(50) | YES |  |

| IName3 | varchar(50) | YES |  |

| IName4 | varchar(50) | YES |  |

| IName5 | varchar(50) | YES |  |

## dbo.IncomeStm_GroupView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(50) | YES |  |

| ParentID2 | bigint | YES |  |

| ParentName2 | varchar(50) | YES |  |

| ParentID3 | bigint | YES |  |

| ParentName3 | varchar(50) | YES |  |

| ParentStatus2 | smallint | NO |  |

| ParentStatus3 | smallint | NO |  |

| Status | smallint | NO |  |

| NotReqTot2 | smallint | YES |  |

| NotReqTot3 | smallint | YES |  |

| NotReqTot | smallint | YES |  |

| NotReqHed2 | bit | YES |  |

| NotReqHed3 | bit | YES |  |

| NotReqHed | bit | YES |  |

| CorporationID | binary(18) | YES |  |

| GrpHideAcc1 | bit | YES |  |

| GrpHideAcc2 | bit | YES |  |

| GrpHideAcc3 | bit | YES |  |

## dbo.IncomeStmt_Configuration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| SubDeptID | bigint | NO |  |

| GroupID | bigint | YES |  |

| Type | tinyint | YES |  |

| Order | tinyint | YES |  |

| Status | tinyint | YES |  |

| MID | bigint | YES |  |

| ServiceType | tinyint | YES |  |

| IsAlloc | bit | YES |  |

| IsNOE | bit | NO | ((0)) |

## dbo.IncomeStmt_Configuration_Clone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| SubDeptID | bigint | NO |  |

| GroupID | bigint | YES |  |

| Type | tinyint | YES |  |

| Order | tinyint | YES |  |

| Status | tinyint | YES |  |

| ServiceType | tinyint | YES |  |

## dbo.IncomeStmt_ConfigurationDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ConfigID | bigint | YES |  |

| AccountID | binary(18) | YES |  |

| Order | smallint | YES |  |

| Status | tinyint | YES |  |

| EnableStatistics | smallint | YES |  |

| PayrollItemType | smallint | YES |  |

| HoursType | smallint | YES |  |

| MapingID | bigint | YES |  |

## dbo.IncomeStmt_ConfigurationDetails_Clone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ConfigID | bigint | YES |  |

| AccountID | binary(18) | YES |  |

| Order | smallint | YES |  |

| Status | tinyint | YES |  |

| EnableStatistics | smallint | YES |  |

| PayrollItemType | smallint | YES |  |

| HoursType | smallint | YES |  |

## dbo.IncomeStmt_Group

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | varchar(50) | YES |  |

| ParentID | bigint | YES |  |

| NotReqTot | smallint | YES |  |

| Status | smallint | YES |  |

| CommonMappingID | bigint | YES |  |

| NotReqHed | bit | YES |  |

| HideAccounts | bit | YES |  |

## dbo.IncomeStmt_Group_Clone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | varchar(50) | YES |  |

| ParentID | bigint | YES |  |

| NotReqTot | smallint | YES |  |

| Status | smallint | YES |  |

| ServiceType | tinyint | YES |  |

| NotReqHed | bit | YES |  |

## dbo.IncomeStmt_SubDepartment

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(100) | YES |  |

| CorporationID | binary(18) | YES |  |

| DepartmentID | bigint | YES |  |

| Type | tinyint | YES |  |

| Order | tinyint | YES |  |

| Status | tinyint | YES |  |

| DailyConfigDeptId | binary(18) | YES |  |

| CommonMappingID | bigint | YES |  |

| DeptType | smallint | YES |  |

| IncOrExpType | smallint | YES |  |

| ClientID | binary(18) | YES |  |

| IsPageBreak | tinyint | YES |  |

| ShowInIncome | tinyint | YES |  |

| ShowSubDep | tinyint | YES |  |

| SubDepSeperationEnable | tinyint | YES |  |

| EnableStat | tinyint | YES |  |

| ShowExpSumm | bit | YES |  |

## dbo.IncomeStmt_SubDepartment_Clone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(100) | YES |  |

| CorporationID | binary(18) | YES |  |

| DepartmentID | bigint | YES |  |

| Type | tinyint | YES |  |

| Order | tinyint | YES |  |

| Status | tinyint | YES |  |

| DailyConfigDeptId | binary(18) | YES |  |

| ServiceType | tinyint | YES |  |

| DeptType | smallint | YES |  |

| IncOrExpType | smallint | YES |  |

| ShowInIncome | tinyint | YES |  |

| ClientID | binary(18) | YES |  |

| IsPageBreak | tinyint | YES |  |

| ShowSubDep | tinyint | YES |  |

| SubDepSeperationEnable | tinyint | YES |  |

## dbo.IncomeStmtCustomization

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReportName | varchar(50) | YES |  |

| Notes | varchar(250) | YES |  |

| MenuID | binary(18) | YES |  |

| Status | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ClientID | binary(18) | YES |  |

| IsDefault | bit | YES |  |

| IncOrCons | smallint | YES |  |

## dbo.IncStmtLayoutPref

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| IncomeStmtCustID | bigint | YES |  |

| LookupID | binary(18) | YES |  |

| RenamedName | varchar(150) | YES |  |

| IsHideFromNextLine | bit | YES |  |

| Status | smallint | YES |  |

## dbo.IncStmtShowPayrolls

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| IncomeStmtCustID | bigint | YES |  |

| PayID | binary(18) | YES |  |

| IsShow | bit | YES |  |

| Status | smallint | YES |  |

## dbo.InterCompanyReferences

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| FromMainTransactionID | binary(18) | YES |  |

| FromTransactionID | binary(18) | YES |  |

| ToCreditTransactionID | binary(18) | YES |  |

| ToDebitTransactionID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| FromJournalEntryID | binary(18) | YES |  |

| ToJournalEntryID | binary(18) | YES |  |

| ToCorporationID | binary(18) | YES |  |

| Order | int | YES |  |

| Status | smallint | YES |  |

## dbo.Inventory

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| StoreFranchiseeID | binary(18) | NO |  |

| InventoryDateTime | datetime2 | NO |  |

| Status | tinyint | NO |  |

## dbo.InventoryDetail

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| StoreProductID | binary(18) | NO |  |

| Quantity | decimal | NO |  |

| Memo | varchar(50) | YES | (NULL) |

| Status | tinyint | YES | (NULL) |

| InventoryID | binary(18) | NO |  |

## dbo.InvoiceRefund

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ContactID | binary(18) | YES |  |

## dbo.InvoiceWiseComissionPay

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| InvoiceID | binary(18) | NO |  |

| PayAmount | decimal | YES |  |

| PayrollID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| PayrollEmployeeID | binary(18) | NO |  |

| ContributionAmt | decimal | YES |  |

| Contrbution | decimal | YES |  |

| WagesAmt | decimal | YES |  |

## dbo.JEPayrollMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ClientID | varchar(50) | NO |  |

| CorporationID | binary(18) | YES |  |

| CorporationName | varchar(150) | YES |  |

| MappingType | tinyint | YES |  |

| Status | tinyint | YES |  |

| ImportsCount | varchar(50) | YES |  |

## dbo.JEPayrollMappingDetail

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| MappingName | varchar(150) | YES |  |

| MappingID | binary(18) | YES |  |

| MappingType | smallint | YES |  |

| PayrollMappingID | binary(18) | YES |  |

| Status | tinyint | YES |  |

## dbo.JournalChatInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalEntryID | binary(18) | NO |  |

| RoomID | varchar(50) | NO |  |

| Status | smallint | YES |  |

| MessageUnreadCount | int | YES |  |

## dbo.JournalEntry

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(100) | YES | (NULL) |

| SourceType | smallint | YES | (NULL) |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES | (NULL) |

| ParentID | binary(18) | YES | (NULL) |

| ReferenceMode | smallint | YES | (NULL) |

| IsMailSent | bit | YES | (NULL) |

| MailSentCount | tinyint | YES |  |

| Status | int | YES | (NULL) |

| TransNumber | int | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| IsPrintRequired | bit | YES |  |

| IsAccrual | smallint | YES |  |

| CreatedDate | datetime2 | YES | (getdate()) |

| ModifiedDate | datetime2 | YES |  |

| IsUpdated | tinyint | YES |  |

| ReferenceType | smallint | YES |  |

| IsAttachment | smallint | YES |  |

| HoldPayment | smallint | YES |  |

| PaymentMethodID | binary(18) | YES |  |

| ClearedDate | datetime2 | YES |  |

| EntryType | tinyint | YES |  |

| RefID | binary(18) | YES |  |

| DepositID | varchar(100) | YES |  |

| PaytokenID | varchar(100) | YES |  |

| TransferMode | smallint | YES |  |

| IsSkipFromSchedule | smallint | YES |  |

| AuthCode | varchar(50) | YES |  |

| IsBlankWhitePrintRequired | bit | YES |  |

| BillDate | datetime2 | YES |  |

| JID | bigint | NO |  |

| VoidDate | datetime2 | YES |  |

| SettlementDate | datetime2 | YES |  |

## dbo.JournalEntryExt

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalEntryID | binary(18) | NO |  |

| IsUpdated | bit | NO |  |

| SubTypeName | varchar(250) | YES |  |

| AdjustmentLinkID | binary(18) | YES |  |

| IsNimbleACH | bit | YES |  |

| CheckMemo | varchar(500) | YES |  |

| VoidRemarks | varchar(500) | YES |  |

## dbo.JournalEntryTransactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| EntryDate | datetime2 | NO |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| TransID | binary(18) | NO |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| CorporationName | varchar(100) | NO |  |

| LegalName | varchar(100) | YES |  |

| CorporationID | binary(18) | NO |  |

| AccountName | varchar(127) | YES |  |

| AccountID | binary(18) | YES |  |

| ParentID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| ParentSourceType | smallint | YES |  |

| AccountTypeOrder | smallint | YES |  |

| SortOrder | smallint | YES |  |

| Order | int | YES |  |

| AccountNumber | varchar(25) | YES |  |

| PeriodDateStart | varchar(5) | YES |  |

| IsCalendarYear | int | NO |  |

| PLAccount | int | NO |  |

| IncomeType | int | NO |  |

| IsRetainedEarnings | int | NO |  |

| JournalSourceType | smallint | YES |  |

## dbo.JournalTransactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| ReferenceMode | smallint | YES |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| Memo | varchar(500) | YES |  |

| TransID | binary(18) | NO |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| CorporationName | varchar(100) | YES |  |

| LegalName | varchar(100) | YES |  |

| CorporationID | binary(18) | NO |  |

| StoreName | varchar(50) | YES |  |

| FranchiseeName | varchar(50) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| AccountName | varchar(127) | YES |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| AccountID | binary(18) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| BankType | varchar(1) | NO |  |

| AccountStatus | tinyint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TransType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| JESourceID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Name | varchar(151) | YES |  |

| PurposeName | varchar(201) | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransactionDate | datetime2 | NO |  |

| Order | smallint | YES |  |

| CreatedByID | binary(18) | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedByID | binary(18) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| VoidDate | datetime2 | YES |  |

## dbo.LedgerTransactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| EntryDate | datetime2 | NO |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| TargetName | varchar(100) | YES |  |

| TransactionDate | datetime2 | NO |  |

| TransNumber | int | YES |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| Memo | varchar(500) | YES |  |

| TransID | binary(18) | NO |  |

| JESourceID | binary(18) | YES |  |

| CorporationName | varchar(100) | YES |  |

| CorporationID | binary(18) | NO |  |

| StoreName | varchar(50) | YES |  |

| FranchiseeName | varchar(50) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| AccountName | varchar(127) | YES |  |

| AccountTypeID | binary(18) | NO |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| JournalSourceID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| BankType | varchar(1) | NO |  |

| AccountStatus | tinyint | NO |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TransType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Name | varchar(151) | YES |  |

| PurposeName | varchar(201) | YES |  |

| SplitAccountName | varchar(127) | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransSourceID | binary(18) | YES |  |

| CreatedByUser | varchar(101) | YES |  |

| ModifiedByUser | varchar(101) | YES |  |

| VoidDate | datetime2 | YES |  |

## dbo.LoadCC

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(54) | NO |  |

| ActualName | varchar(50) | NO |  |

| Status | smallint | NO |  |

| D2ID | binary(18) | YES |  |

| D3ID | binary(18) | YES |  |

| CCNameOrder | varchar(153) | YES |  |

| AddressID | binary(18) | YES |  |

| ContactID | binary(18) | YES |  |

## dbo.LoadPLGroup

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ClientID | binary(18) | YES |  |

| GroupName | varchar(104) | NO |  |

| ActualGroupName | varchar(100) | NO |  |

| Description | varchar(100) | YES |  |

| GroupOrder | smallint | YES |  |

| Status | smallint | YES |  |

| G2ID | binary(18) | YES |  |

| G3ID | binary(18) | YES |  |

| GroupNameOrder | varchar(318) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| Type | smallint | YES |  |

| SName2 | varchar(100) | YES |  |

| SName3 | varchar(100) | YES |  |

## dbo.LoanRepayment

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| PayeeType | smallint | NO |  |

| PayeeID | binary(18) | NO |  |

| Status | smallint | NO |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES | (NULL) |

## dbo.LoanScheduleTransactionDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| LoanScheduleTransactionID | binary(18) | NO |  |

| VendorID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| PrincipalAccountID | binary(18) | YES |  |

| IntrestAccountID | binary(18) | YES |  |

| SBAAccountID | binary(18) | YES |  |

| CDCAccountID | binary(18) | YES |  |

| CSAAccountID | binary(18) | YES |  |

| CustomAccountID | binary(18) | YES |  |

| JournalEntryID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

## dbo.LoanScheduleTransactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| LoanScheduleID | binary(18) | NO |  |

| OriginalDate | date | YES |  |

| DueDate | date | YES |  |

| NetDaysID | binary(18) | YES |  |

| BeginningBalance | decimal | YES |  |

| MonthlyInterestRate | decimal | YES |  |

| MonthlyAmount | decimal | YES |  |

| InterestDaysMonths | smallint | YES |  |

| InterestDaysYears | smallint | YES |  |

| MonthlyInterestAmount | decimal | YES |  |

| SBAAmount | decimal | YES |  |

| CDCAmount | decimal | YES |  |

| CSAAmount | decimal | YES |  |

| CustomAmount | decimal | YES |  |

| PrincipalAmount | decimal | YES |  |

| BalanceDueAmount | decimal | YES |  |

| PaymentStatus | smallint | YES |  |

| ReconStatus | smallint | YES |  |

| Order | smallint | YES |  |

| PaymentStatusType | smallint | YES |  |

## dbo.LoanShedule

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | varchar(200) | YES |  |

| OriginalDate | date | NO |  |

| PaymentStartDate | date | NO |  |

| NetDaysID | binary(18) | YES |  |

| AccountNumberPayble | varchar(200) | YES |  |

| BeginningBalance | decimal | NO |  |

| MonthlyInterestRate | float | NO |  |

| InterestDaysMonths | smallint | YES |  |

| InterestDaysYears | smallint | YES |  |

| MonthlyPayment | decimal | YES |  |

| SBAField | varchar(50) | YES |  |

| SBAAmount | decimal | YES |  |

| CDCField | varchar(50) | YES |  |

| CDCAmount | decimal | YES |  |

| CSAField | varchar(50) | YES |  |

| CSAAmount | decimal | YES |  |

| CustomField | varchar(50) | YES |  |

| CustomAmount | decimal | YES |  |

| Status | smallint | YES |  |

## dbo.Locking

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| LockPeriodType | tinyint | NO |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| TransactionType | varchar(500) | NO |  |

| UserID | binary(18) | NO |  |

| LockDate | datetime2 | NO |  |

## dbo.Lookup

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| Code | varchar(12) | YES | (NULL) |

| Value | varchar(50) | NO |  |

| Description | varchar(200) | YES | (NULL) |

| Order | smallint | YES | (NULL) |

| SourceType | smallint | YES | (NULL) |

| Status | smallint | YES | (NULL) |

| SourceMappingXml | varchar(8000) | YES |  |

## dbo.LookupType

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

## dbo.MasterBinAuditing

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EntityID | binary(18) | NO |  |

| EntityType | smallint | YES |  |

| ActionDate | datetime2 | YES |  |

| ActionBy | binary(18) | YES |  |

| ActionType | smallint | YES |  |

| IP | varchar(250) | YES |  |

| Browser | varchar(250) | YES |  |

## dbo.MasterLongAuditing

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| EntityID | bigint | NO |  |

| EntityType | smallint | YES |  |

| ActionDate | datetime2 | YES |  |

| ActionBy | binary(18) | YES |  |

| ActionType | smallint | YES |  |

| IP | varchar(250) | YES |  |

| Browser | varchar(250) | YES |  |

## dbo.MenuInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| MenuId | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Status | smallint | NO |  |

| IsHeader | bit | NO |  |

| Order | int | NO |  |

## dbo.MenuInformation

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| MenuID | binary(18) | YES |  |

| Name | nvarchar(250) | YES |  |

| NavigationURL | nvarchar(500) | YES |  |

| HelpURL | nvarchar(500) | YES |  |

| Level | smallint | YES |  |

| IsDefault | smallint | YES |  |

| Order | bigint | YES |  |

| ParentID | binary(18) | YES |  |

| Status | smallint | YES |  |

| IsAdmin | bit | YES |  |

| IconClass | varchar(50) | YES |  |

| IsDashBoard | bit | YES |  |

| IsFromProfile | bit | YES |  |

| IsDynamicMenu | bit | YES |  |

| IsScheduledReport | bit | YES |  |

## dbo.MenusInfoList

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| MenuID | binary(18) | YES |  |

| Name | nvarchar(250) | YES |  |

| NavigationURL | nvarchar(500) | YES |  |

| HelpURL | nvarchar(500) | YES |  |

| Level | smallint | YES |  |

| IsDefault | smallint | YES |  |

| Order | bigint | YES |  |

| Status | smallint | YES |  |

| IsAdmin | bit | YES |  |

| IsDashBoard | bit | YES |  |

| ID1 | bigint | YES |  |

| MenuID1 | binary(18) | YES |  |

| Name1 | nvarchar(250) | YES |  |

| NavigationURL1 | nvarchar(500) | YES |  |

| HelpURL1 | nvarchar(500) | YES |  |

| Level1 | smallint | YES |  |

| IsDefault1 | smallint | YES |  |

| Order1 | bigint | YES |  |

| Status1 | smallint | YES |  |

| IsAdmin1 | bit | YES |  |

| IsDashBoard1 | bit | YES |  |

| ID2 | bigint | YES |  |

| MenuID2 | binary(18) | YES |  |

| Name2 | nvarchar(250) | YES |  |

| NavigationURL2 | nvarchar(500) | YES |  |

| HelpURL2 | nvarchar(500) | YES |  |

| Level2 | smallint | YES |  |

| IsDefault2 | smallint | YES |  |

| Order2 | bigint | YES |  |

| Status2 | smallint | YES |  |

| IsAdmin2 | bit | YES |  |

| IsDashBoard2 | bit | YES |  |

| ID3 | bigint | YES |  |

| MenuID3 | binary(18) | YES |  |

| Name3 | nvarchar(250) | YES |  |

| NavigationURL3 | nvarchar(500) | YES |  |

| HelpURL3 | nvarchar(500) | YES |  |

| Level3 | smallint | YES |  |

| IsDefault3 | smallint | YES |  |

| Order3 | bigint | YES |  |

| Status3 | smallint | YES |  |

| IsAdmin3 | bit | YES |  |

| IsDashBoard3 | bit | YES |  |

| IsFromProfile | bit | YES |  |

| IsFromProfile1 | bit | YES |  |

| IsFromProfile2 | bit | YES |  |

| IsFromProfile3 | bit | YES |  |

## dbo.Message

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| MessageFrom | binary(18) | YES | (NULL) |

| MessageGroupID | binary(18) | NO |  |

| CorporationID | binary(18) | YES | (NULL) |

| MessageType | smallint | NO |  |

| Subject | varchar(100) | YES | (NULL) |

| MessageText | varchar(-1) | YES |  |

| Status | smallint | NO |  |

## dbo.MessageGroup

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| MessageGroupName | varchar(50) | NO |  |

| Status | smallint | NO |  |

## dbo.MessageRecepient

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| MessageID | binary(18) | NO |  |

| MessageTo | binary(18) | NO |  |

| AlertViewStatus | bit | NO |  |

| MessageSentDate | datetime2 | NO |  |

| Status | tinyint | YES | (NULL) |

## dbo.MiscInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Description | varchar(200) | YES |  |

| SourceType | smallint | NO |  |

| Status | tinyint | NO |  |

| ClientID | binary(18) | YES |  |

| PrintType | smallint | YES |  |

| IsNimbleACH | bit | YES |  |

| PaymentMethodType | smallint | YES |  |

## dbo.MissedSalesDate

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| MissedSaleId | bigint | NO |  |

| Id | binary(18) | YES |  |

| CorpName | nvarchar(100) | YES |  |

| MissedSaleDate | datetime | NO |  |

| Status1 | nvarchar(50) | YES |  |

| PCName | nvarchar(100) | YES |  |

| DailyConfigId | binary(18) | YES |  |

| PCID | binary(18) | YES |  |

## dbo.NimbleATSTracker

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | NO |  |

| CreatedDateTime | datetime | YES |  |

| ModifiedDateTime | datetime2 | YES |  |

| TransactionID | nvarchar(50) | NO |  |

## dbo.OCRCreditTerm

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CreditDays | binary(18) | YES | (NULL) |

| DueDate | date | NO |  |

| ShipDate | date | YES |  |

| ShipVia | binary(18) | YES |  |

| ManagerID | binary(18) | YES |  |

| RecruiterID | binary(18) | YES |  |

| RepresentativeID | binary(18) | YES |  |

| ContactID | binary(18) | YES |  |

| AccContractID | binary(18) | YES |  |

## dbo.OCRJournalEntry

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| EntryDate | datetime2 | YES |  |

| EntryNumber | varchar(50) | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| ParentID | binary(18) | YES |  |

| ReferenceMode | smallint | YES |  |

| Status | int | YES |  |

| TransNumber | int | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| IsAttachment | smallint | YES |  |

| ReferencedID | binary(18) | YES |  |

| ApprovedDate | datetime2 | YES |  |

| ApprovedBy | binary(18) | YES |  |

| AssignedTo | binary(18) | YES |  |

| ApprovalLevel | smallint | YES |  |

| ApprovalStatus | smallint | YES |  |

| RefID | binary(18) | YES |  |

| BillDate | datetime2 | YES |  |

| JID | bigint | NO |  |

| PaymentMethodID | binary(18) | YES | (NULL) |

## dbo.OCRTemplateAttributes

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| TemplateId | binary(18) | YES |  |

| AttributeInfo | nvarchar(-1) | YES |  |

| CreatedOn | datetime2 | YES |  |

| ModifiedOn | datetime2 | YES |  |

| Status | int | YES |  |

## dbo.OCRTemplateConfiguration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ConfigID | bigint | YES |  |

| VendorID | binary(18) | YES |  |

| DefaultAccountID | binary(18) | YES |  |

| TemplateName | varchar(50) | YES |  |

| ConfigFilePath | varchar(200) | YES |  |

| IsDefault | bit | YES |  |

| Status | int | YES |  |

| CreatedOn | datetime2 | YES |  |

| ModifiedOn | datetime2 | YES |  |

## dbo.OCRTransaction

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| AccountID | binary(18) | YES |  |

| JournalEntryID | binary(18) | YES |  |

| ParentID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| DebitCredit | bit | YES |  |

| TransactionDate | datetime2 | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| Memo | varchar(500) | YES |  |

| Status | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| Order | smallint | YES |  |

| TargetType | smallint | YES |  |

| TargetID | binary(18) | YES |  |

| TID | bigint | NO |  |

## dbo.OCRTransactionInvoice

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| InvoiceID | binary(18) | YES |  |

| Hrs | decimal | YES |  |

| Rate | decimal | YES |  |

| TaxRate | decimal | YES |  |

| SourceID | binary(18) | YES |  |

| Status | tinyint | YES |  |

| AccContractID | binary(18) | YES |  |

| BaseDebitCredit | bit | YES |  |

## dbo.OCRTransactionTaxInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| TransactionID | binary(18) | NO |  |

| UseTaxRateID | bigint | YES |  |

| UseTaxRateID2 | bigint | YES |  |

| UseTaxDetailsID | bigint | YES |  |

| Rate1 | decimal | YES |  |

| Rate2 | decimal | YES |  |

| Status | smallint | NO |  |

| UseTaxID | bigint | YES |  |

## dbo.OperaCorpPath

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| Path | varchar(-1) | YES |  |

| Status | smallint | YES |  |

## dbo.OtherBillPaymentsDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| ReconStatus | tinyint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| JournalEntryID | binary(18) | NO |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(50) | YES |  |

| JournalSourceType | smallint | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| TransNumber | int | YES |  |

| BillAmount | decimal | NO |  |

| DiscountAmount | decimal | YES |  |

| PaidAmount | decimal | YES |  |

| OriginalAmount | decimal | YES |  |

| ParentSourceType | smallint | YES |  |

| JournalStatus | int | YES |  |

| TranStatus | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| BillOrder | smallint | YES |  |

| TransID | binary(18) | NO |  |

| PaymentJournalEntryID | binary(18) | NO |  |

| AccountName | varchar(127) | YES |  |

| PurposeName | varchar(100) | YES |  |

| Memo | varchar(500) | YES |  |

## dbo.OtherRevenue

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| CorporationID | binary(18) | NO |  |

| Type | smallint | YES |  |

| Status | smallint | NO |  |

## dbo.OverHeadAccountMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Status | tinyint | YES |  |

## dbo.PackageDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| AddOnID | binary(18) | NO |  |

| IsDefault | bit | NO |  |

| SubscriptionType | smallint | YES |  |

## dbo.PackageDiscount

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SubscriptionType | smallint | NO |  |

| Discount | decimal | NO |  |

| ExpiryDate | datetime2 | YES |  |

## dbo.PaidBillTimeSheets

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| InfoDate | datetime2 | YES |  |

## dbo.PaidVendorTimeSheets

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| InfoDate | datetime2 | YES |  |

## dbo.PAndLStandardView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountTypeName | varchar(50) | NO |  |

| AccountName | varchar(127) | YES |  |

| AccountTypeID | int | NO |  |

| GrossProfit | int | NO |  |

| NetOrdinaryIncome | int | NO |  |

| NetIncome | int | NO |  |

| AccountName1 | varchar(127) | YES |  |

| AccountName2 | varchar(127) | YES |  |

| AccountName3 | varchar(127) | YES |  |

| AccountName4 | varchar(127) | YES |  |

| AccountID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

## dbo.PaymentBatchIssue

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Id | bigint | NO |  |

| AvlBatchNumber | bigint | YES |  |

| CorporationId | binary(18) | YES |  |

| AccountId | binary(18) | YES |  |

| IssueType | smallint | YES |  |

| Status | smallint | NO |  |

| ClientID | binary(18) | YES |  |

| PaymethodID | binary(18) | YES |  |

| FormatId | bigint | YES |  |

## dbo.PaymentDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | NO |  |

| CreatedDate | datetime2 | NO |  |

| StartDate | datetime2 | NO |  |

| EndDate | datetime2 | NO |  |

| PaymentType | int | NO |  |

| Amount | decimal | YES |  |

| Duration | int | YES |  |

| PaymentMode | tinyint | YES |  |

## dbo.PaymentNumberIssue

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Id | bigint | NO |  |

| AvailableNumber | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| PaymethodID | binary(18) | YES |  |

| Status | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| CreatedDate | datetime | YES |  |

## dbo.Payroll

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| PCID | binary(18) | YES |  |

| AccountID | binary(18) | NO |  |

| ChecknumType | tinyint | NO |  |

| Name | varchar(50) | NO |  |

| FrequencyID | binary(18) | NO |  |

| PeriodFrom | datetime2 | NO |  |

| PeriodTo | datetime2 | NO |  |

| CheckDate | datetime2 | NO |  |

| PayrollType | tinyint | NO |  |

| AcrualEntryRequired | tinyint | NO |  |

| Status | tinyint | NO |  |

| AcrualStatus | bit | YES |  |

| AcrualEntryBaseID | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| ModifiedDate | datetime2 | YES |  |

| ImportPayrollType | tinyint | YES |  |

## dbo.PayrollAgency

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Code | varchar(10) | YES | (NULL) |

| AddressID | binary(18) | YES | (NULL) |

| Type | smallint | NO |  |

| Status | smallint | NO |  |

| ContactID | binary(18) | YES | (NULL) |

| ContactName | varchar(50) | YES | (NULL) |

## dbo.PayrollConfigSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ClientID | binary(18) | YES |  |

| PayrollName | varchar(100) | YES |  |

| DataReadFrom | int | YES |  |

| Templatepath | varchar(500) | YES |  |

| TemplateType | int | YES |  |

| Status | smallint | YES |  |

| PayrollType | int | YES |  |

## dbo.PayrollConfigSettingsDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| PayrollImportConfigID | bigint | YES |  |

| ColumnName | varchar(100) | YES |  |

| Type | int | YES |  |

| ColumnType | int | YES |  |

| Order | int | YES |  |

| Status | smallint | YES |  |

| GroupingType | int | YES |  |

| SignType | int | YES |  |

## dbo.PayrollDepartment

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | varchar(100) | YES |  |

| IncomeStmtDeptID | bigint | YES |  |

| IncomeStmtSubDeptID | bigint | YES |  |

| CreatedBY | binary(18) | YES |  |

| ModifiedBY | binary(18) | YES |  |

| CreatedDate | datetime | YES |  |

| ModifiedDate | datetime | YES |  |

| Status | smallint | YES |  |

| CommonMappingID | binary(18) | YES |  |

| DepartmentID | binary(18) | YES |  |

| DepartmentName | varchar(250) | YES |  |

| JobID | binary(18) | YES |  |

| Order | int | YES |  |

## dbo.PayrollDepartmentInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| Name | varchar(100) | YES |  |

| IncomeStmtDeptID | bigint | YES |  |

| IncomeStmtSubDeptID | bigint | YES |  |

| CreatedBY | binary(18) | YES |  |

| ModifiedBY | binary(18) | YES |  |

| CreatedDate | datetime | YES |  |

| ModifiedDate | datetime | YES |  |

| Status | smallint | YES |  |

| CommonMappingID | binary(18) | YES |  |

| JobID | binary(18) | YES |  |

## dbo.PayrollDetail

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| PCID | binary(18) | YES |  |

| CCID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | tinyint | NO |  |

| ExpenseAccountID | binary(18) | YES |  |

| AccountID | binary(18) | NO |  |

| ProjectID | binary(18) | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| OtherID | binary(18) | YES |  |

| LimitAmount | decimal | YES |  |

| Amount | decimal | NO |  |

| Hrs | decimal | YES |  |

| Rate | decimal | YES |  |

| IsPerDiem | bit | YES |  |

| Status | tinyint | NO |  |

| Order | tinyint | YES |  |

## dbo.PayrollEmployee

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| PayrollID | binary(18) | NO |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| EmployeeID | binary(18) | NO |  |

| CheckNo | varchar(50) | YES |  |

| PCID | binary(18) | YES |  |

| RefID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| Status | tinyint | NO |  |

| Type | tinyint | YES |  |

| DepartmentID | binary(18) | YES |  |

| DepartmentName | varchar(250) | YES |  |

| JobID | binary(18) | YES |  |

## dbo.PayrollEmployeeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| PayrollEmployeeID | binary(18) | NO |  |

| CheckNum | varchar(50) | YES |  |

| Amount | decimal | NO |  |

## dbo.PayrollItem

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Type | smallint | NO |  |

| Description | varchar(100) | YES |  |

| Name | varchar(50) | NO |  |

| AccountID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Status | tinyint | NO |  |

| IsOtherTax | bit | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

## dbo.PayrollItemInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| LiabilityAccountID | binary(18) | YES |  |

| WageTypeID | binary(18) | YES |  |

| PayTypeID | binary(18) | YES |  |

| Rate | decimal | YES |  |

| TrackTypeID | binary(18) | YES |  |

| CalculateOnType | tinyint | YES |  |

| StateID | bigint | YES |  |

| Recoverable | bit | YES |  |

## dbo.PayrollItemOtherTax

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| PayrollItemID | binary(18) | NO |  |

| TaxableItemID | binary(18) | NO |  |

| Type | tinyint | NO |  |

## dbo.PayrollItemTaxInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| PayrollItemID | binary(18) | NO |  |

| TaxID | int | YES |  |

| StateID | bigint | YES |  |

| Type | tinyint | YES |  |

## dbo.PayrollJEImportFormateSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| PayrollImportConfigID | bigint | YES |  |

| Date | varchar(50) | YES |  |

| Name | varchar(50) | YES |  |

| CorporationID | varchar(50) | YES |  |

| Account | varchar(50) | YES |  |

| Description | varchar(50) | YES |  |

| ProfileCenter | varchar(50) | YES |  |

| AmountType | smallint | YES |  |

| AmountMode | smallint | YES |  |

| AmountColumn1 | varchar(50) | YES |  |

| AmountColumn2 | varchar(50) | YES |  |

| Status | smallint | YES |  |

| ColumnCount | int | YES |  |

| AmountColumnMode | smallint | YES |  |

## dbo.PayrollJobInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(200) | YES |  |

| Description | varchar(1024) | YES |  |

| Status | tinyint | YES |  |

| ClientID | binary(18) | YES |  |

## dbo.PayrollMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ItemName | varchar(150) | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| ResourceID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| MappingType | tinyint | YES |  |

| Status | tinyint | YES |  |

| ImportsCount | varchar(50) | YES |  |

| DepartmentID | binary(18) | YES |  |

| DepartmentName | varchar(250) | YES |  |

| PCName | varchar(150) | YES |  |

| PCID | binary(18) | YES |  |

| JobID | binary(18) | YES |  |

## dbo.PayrollMappingDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ItemName | varchar(150) | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| PayrollMappingID | binary(18) | YES |  |

| Status | tinyint | YES |  |

## dbo.PayrollUsedTimeSheets

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| CorporationID | binary(18) | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| EmployeeID | binary(18) | NO |  |

| PaidHrs | decimal | YES |  |

| Hrs | decimal | YES |  |

| Rate | decimal | NO |  |

| WagesAmt | int | NO |  |

| Contribution | int | NO |  |

| ProjectID | binary(18) | NO |  |

| TargetID | binary(18) | YES |  |

| PeriodFrom | datetime2 | NO |  |

| PeriodTo | datetime2 | NO |  |

| AgreedRate | decimal | YES |  |

## dbo.PayrollUsedTimesSheets

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| PayrollID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| PayrollEmployeeID | binary(18) | NO |  |

| HRs | decimal | YES |  |

| Rate | decimal | YES |  |

| WagesAmt | int | NO |  |

| Contribution | int | NO |  |

| EmployeeID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| ProjectID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| TimeSheetDate | datetime2 | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | tinyint | NO |  |

## dbo.PCTransactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| TransactionID | binary(18) | YES |  |

| PCID | binary(18) | YES |  |

| Amount | decimal | YES |  |

| RefID | binary(18) | YES |  |

| Oustanding | decimal | YES |  |

| DebitCredit | bit | NO | ((0)) |

## dbo.Percentage

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| AccountID | binary(18) | NO |  |

| Type | tinyint | NO |  |

| CommissionType | tinyint | NO |  |

| PercentageType | tinyint | YES |  |

| Amount | decimal | YES |  |

| Percentage | decimal | YES |  |

| Status | tinyint | NO |  |

## dbo.PercentageDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| PercentageID | binary(18) | YES |  |

| CustomerID | binary(18) | YES |  |

| CommissionType | tinyint | YES |  |

| Amount | decimal | YES |  |

| Percentage | decimal | YES |  |

## dbo.Permission

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | YES | (NULL) |

| TargetID | binary(18) | YES | (NULL) |

| Access | bit | NO |  |

| ClientID | binary(18) | YES | (NULL) |

| Type | int | YES | (NULL) |

| UserID | binary(18) | YES |  |

## dbo.Plaid_BankInstitutionInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Id | bigint | NO |  |

| AccessToken | varchar(100) | YES |  |

| InstitutionName | varchar(250) | YES |  |

| InstitutionID | varchar(50) | YES |  |

| ClientId | binary(18) | YES |  |

| CreatedOn | datetime2 | YES |  |

| CorporationId | binary(18) | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| AutoSyncHitDate | datetime2 | YES |  |

## dbo.Plaid_BankLoginInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BankAccountId | varchar(50) | YES |  |

| AccessToken | varchar(50) | YES |  |

| ItemId | varchar(50) | YES |  |

| Name | varchar(250) | YES |  |

| OfficialName | varchar(250) | YES |  |

| Balance | decimal | YES |  |

| Type | varchar(50) | YES |  |

| SubType | varchar(50) | YES |  |

| Status | smallint | YES |  |

| AccountId | binary(18) | YES |  |

| CreatedOn | datetime2 | YES |  |

| ClientID | binary(18) | YES |  |

| InstitutionId | bigint | YES |  |

| SyncFeedsFrom | datetime2 | YES |  |

| AccountNumber | varchar(50) | YES |  |

| FormatType | smallint | YES |  |

| FormatID | bigint | YES |  |

| CorporationID | binary(18) | YES |  |

| RefreshedOn | datetime2 | YES |  |

| BankAccountEditName | varchar(250) | YES |  |

| IsSyncProcessDone | smallint | YES |  |

| SyncEndtime | datetime2 | YES |  |

| IsSyncEnable | smallint | YES |  |

| AvailableBalance | decimal | YES |  |

## dbo.Plaid_BankTransactions

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BankLoginId | bigint | NO |  |

| CheckNo | varchar(30) | YES |  |

| Amount | decimal | YES |  |

| Date | datetime2 | YES |  |

| TransactionId | varchar(150) | YES |  |

| TransactionType | varchar(50) | YES |  |

| Description | varchar(750) | YES |  |

| PageNo | bigint | YES |  |

| Status | smallint | YES |  |

| SyncDate | datetime2 | YES |  |

| EndDate | datetime2 | YES |  |

| RefID | varchar(50) | YES |  |

| IsMatchedtransaction | smallint | YES |  |

| JournalEntryID | binary(18) | YES |  |

| ActualTransactionType | varchar(50) | YES |  |

| AccountID | binary(18) | YES |  |

| PayeeID | binary(18) | YES |  |

| PayeeType | smallint | YES |  |

| ToCorporationID | binary(18) | YES |  |

| RuleID | bigint | YES |  |

| IsAutoApplied | smallint | YES |  |

| BankImportDetailsID | bigint | YES |  |

| TransactionStatusType | smallint | YES |  |

| RunningBalance | decimal | YES |  |

| BookTransactionID | binary(18) | YES |  |

## dbo.PlaidBankAccountDetailsDummy

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| account_id | varchar(50) | YES |  |

| name | varchar(50) | YES |  |

| official_name | varchar(50) | YES |  |

| subtype | varchar(50) | YES |  |

| type | varchar(50) | YES |  |

| mask | varchar(50) | YES |  |

| available | decimal | YES |  |

| current | decimal | YES |  |

| iso_currency_code | varchar(50) | YES |  |

| limit | decimal | YES |  |

| ReqID | varchar(100) | YES |  |

| CorporationID | binary(18) | YES |  |

## dbo.PlaidTransactionsDummy

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| account_id | varchar(50) | YES |  |

| amount | decimal | YES |  |

| category_id | bigint | YES |  |

| date | datetime2 | YES |  |

| name | varchar(50) | YES |  |

| pending | varchar(50) | YES |  |

| pending_transaction_id | varchar(50) | YES |  |

| transaction_id | varchar(50) | YES |  |

| transaction_type | varchar(50) | YES |  |

| ReqID | varchar(100) | YES |  |

| pageNo | bigint | YES |  |

| SyncDate | datetime2 | YES |  |

| RunningBalance | decimal | YES |  |

| official_name | varchar(250) | YES |  |

| mask | varchar(100) | YES |  |

## dbo.PLGeneration

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| StoreID | binary(18) | NO |  |

| GenerationDate | varchar(45) | NO |  |

| Month | smallint | NO |  |

| Year | smallint | NO |  |

## dbo.PLGroup

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GroupName | varchar(205) | YES |  |

| SubGroupID | binary(18) | YES |  |

| Description | varchar(100) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| EnableTotal | bit | YES |  |

| Status | smallint | YES |  |

| GroupOrder | smallint | YES |  |

| ClientID | binary(18) | YES |  |

| Type | smallint | YES |  |

| PurposeType | smallint | YES |  |

## dbo.PLGroupConfigure

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| GroupID | binary(18) | NO |  |

| Type | smallint | NO |  |

| Status | smallint | NO |  |

| PurposeType | smallint | YES |  |

| CommonMappingID | binary(18) | YES |  |

## dbo.PLGroupDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GroupConfigureID | binary(18) | NO |  |

| AccountID | binary(18) | NO |  |

| DetailOrder | smallint | NO |  |

| Status | smallint | NO |  |

## dbo.PLGroupView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| GroupName | varchar(100) | NO |  |

| AccountTypeID | binary(18) | YES |  |

| ParentID1 | binary(18) | YES |  |

| ParentName1 | varchar(100) | YES |  |

| ParentID2 | binary(18) | YES |  |

| ParentName2 | varchar(100) | YES |  |

| Status | smallint | YES |  |

## dbo.PLSubGroupsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| SubGroupID | varchar(50) | YES |  |

| ClientID | binary(18) | YES |  |

| PurposeTypeID | smallint | YES |  |

| PurposeType | varchar(10) | YES |  |

| AccountTypeID | binary(18) | YES |  |

| AccountType | varchar(100) | YES |  |

| GroupName | varchar(8000) | YES |  |

| SubGroupOfID | varchar(50) | YES |  |

| SubGroupOf | varchar(50) | YES |  |

| SortColumn | varchar(1024) | YES |  |

| Level | int | YES |  |

| GroupOrder | smallint | YES |  |

| Order | smallint | YES |  |

| Type | smallint | YES |  |

| GroupTotal | bit | YES |  |

| StatusID | smallint | YES |  |

| Status | varchar(8) | NO |  |

## dbo.PMSCorporationMappindDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| PMSCorpMappingId | bigint | NO |  |

| PMSMappingId | bigint | YES |  |

| LineId | binary(18) | YES |  |

| Order | int | YES |  |

| AccountID | varchar(100) | YES |  |

| AccountDescription | varchar(250) | YES |  |

| PMSCurrencyType | varchar(50) | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| SEQ | varchar(250) | YES |  |

| DebitCreditMapping | smallint | YES |  |

| TransactionType | varchar(250) | YES |  |

| DeptType | smallint | YES |  |

| IsEnding | smallint | YES |  |

## dbo.PMSCorporationMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationId | binary(18) | NO |  |

| FacilityId | varchar(250) | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| MapID | bigint | YES |  |

| StoreID | binary(18) | YES |  |

| AmountReadFrom | varchar(250) | YES |  |

| AliasFacilityId | varchar(600) | YES |  |

## dbo.PMSDetailsClone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| PMSMappingId | bigint | YES |  |

| LineId | binary(18) | YES |  |

| LineName | varchar(250) | YES |  |

| Order | int | YES |  |

| AccountID | varchar(50) | YES |  |

| AccountDescription | varchar(250) | YES |  |

| PMSCurrencyType | varchar(50) | YES |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| SEQ | int | YES |  |

| DebitCreditMapping | smallint | YES |  |

| TransactionType | varchar(250) | YES |  |

| ServiceType | smallint | YES |  |

| HotelChain | tinyint | YES |  |

## dbo.PMSLineInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(100) | NO |  |

| Status | smallint | YES |  |

| DepartmentLineId | binary(18) | YES |  |

| Type | smallint | YES |  |

## dbo.PMSMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AccountID | bigint | YES |  |

| AccountDescription | varchar(250) | YES |  |

| PMSCurrencyType | varchar(50) | YES |  |

| PMSLineId | bigint | NO |  |

| Status | smallint | YES |  |

| Type | smallint | YES |  |

| Order | int | YES |  |

## dbo.Portpolio

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Status | smallint | NO |  |

| Type | smallint | NO |  |

| ClientID | binary(18) | NO |  |

## dbo.Preferences

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserID | binary(18) | NO |  |

| CoporationID | binary(18) | NO |  |

| BankAccountID | binary(18) | YES |  |

| PayrollAccountID | binary(18) | YES |  |

| DCPBillMakePayment | bit | YES |  |

| Type | smallint | YES |  |

| ShowPreview | smallint | YES |  |

| Status | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| IsAutoApproval | bit | YES |  |

| ARDifference | nvarchar(10) | NO | ('') |

## dbo.PrimaryAddOn

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| AddOnID | binary(18) | NO |  |

| Type | tinyint | NO |  |

| MenuID | binary(18) | NO |  |

| Create | bit | NO |  |

| Update | bit | NO |  |

| View | bit | NO |  |

| Delete | bit | NO |  |

| Access | bit | NO |  |

| FranchiseeID | binary(18) | YES |  |

## dbo.Privileges

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| MenuID | binary(18) | NO |  |

| TargetID | binary(18) | YES |  |

| Access | bit | NO |  |

| SourceType | smallint | NO |  |

| GivenBy | binary(18) | NO |  |

| Create | bit | YES |  |

| Update | bit | YES |  |

| View | bit | YES |  |

| Delete | bit | YES |  |

| FranchiseeID | binary(18) | YES |  |

## dbo.ProductProjectView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | YES |  |

| AccountName | varchar(128) | YES |  |

| Type | smallint | NO |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Rate | decimal | YES |  |

| ParentID | binary(18) | YES |  |

| Name | varchar(106) | NO |  |

| ActualName | varchar(100) | NO |  |

| Status | smallint | NO |  |

| S2ID | binary(18) | YES |  |

| S3ID | binary(18) | YES |  |

| BusinessNameOrder | varchar(505) | YES |  |

| SName2 | varchar(100) | YES |  |

| SName3 | varchar(100) | YES |  |

| SName4 | varchar(100) | YES |  |

| SName5 | varchar(100) | YES |  |

| UomID | binary(18) | YES |  |

| UName | varchar(10) | YES |  |

## dbo.ProfitCenter

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| ParentID1 | binary(18) | YES |  |

| ParentID2 | binary(18) | YES |  |

| ParentID3 | binary(18) | YES |  |

| ParentName3 | varchar(50) | YES |  |

| ParentName2 | varchar(50) | YES |  |

| ParentName1 | varchar(50) | YES |  |

| ParentID0 | binary(18) | YES |  |

| ParentName0 | varchar(50) | YES |  |

| Status | smallint | NO |  |

| DefaultStore | smallint | YES |  |

| ParentStatus3 | smallint | YES |  |

| ParentStatus2 | smallint | YES |  |

| ParentStatus1 | smallint | YES |  |

| ParentStatus0 | smallint | YES |  |

| CorporationID | binary(18) | NO |  |

## dbo.ProfitCenterss

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| ParentID1 | binary(18) | YES |  |

| ParentID2 | binary(18) | YES |  |

| ParentID3 | binary(18) | YES |  |

| ParentName3 | varchar(50) | YES |  |

| ParentName2 | varchar(50) | YES |  |

| ParentName1 | varchar(50) | YES |  |

| ParentID0 | binary(18) | YES |  |

| ParentName0 | varchar(50) | YES |  |

| Status | smallint | NO |  |

| DefaultStore | smallint | YES |  |

| ParentStatus3 | smallint | YES |  |

| ParentStatus2 | smallint | YES |  |

| ParentStatus1 | smallint | YES |  |

| ParentStatus0 | smallint | YES |  |

| CorporationID | binary(18) | NO |  |

## dbo.PurchaseCategory

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CategoryName | varchar(100) | NO |  |

| ClientID | binary(18) | NO |  |

| Description | varchar(150) | YES |  |

| Status | smallint | YES |  |

## dbo.PurchaseJournal

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | NO |  |

| PurchaseDate | datetime2 | NO |  |

| VendorID | binary(18) | YES |  |

| Memo | varchar(500) | YES |  |

| PONumber | varchar(20) | YES |  |

| RefNum | varchar(20) | YES |  |

| MessageID | binary(18) | YES |  |

| Status | smallint | YES |  |

| CreatedBY | binary(18) | YES |  |

| CraetedDate | datetime2 | YES |  |

| ModifiedBY | binary(18) | YES |  |

| ModifiedDate | datetime2 | YES |  |

| IsReceived | smallint | YES |  |

| RefID | binary(18) | YES |  |

## dbo.PurchaseTransaction

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| PurchaseJournalID | bigint | YES |  |

| ItemID | binary(18) | YES |  |

| UOM | varchar(50) | YES |  |

| Description | varchar(50) | YES |  |

| Quantity | decimal | YES |  |

| Rate | decimal | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| IsReceived | smallint | YES |  |

| RefID | binary(18) | YES |  |

## dbo.Purpose

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Type | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| AccountID | binary(18) | YES | (NULL) |

| Name | varchar(100) | NO |  |

| Rate | decimal | YES | (NULL) |

| ValidatedBy | binary(18) | YES | (NULL) |

| ValidatedDate | datetime2 | YES | (NULL) |

| Status | smallint | NO |  |

| Description | varchar(100) | YES | (NULL) |

| InventoryItem | bit | YES |  |

| ParentID | binary(18) | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| UomID | binary(18) | YES |  |

| CommonMappingID | binary(18) | YES |  |

## dbo.PurposeView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ServiceName | varchar(108) | NO |  |

| Name | varchar(100) | NO |  |

| ParentID3 | binary(18) | YES |  |

| ParentName3 | varchar(100) | YES |  |

| ParentID2 | binary(18) | YES |  |

| ParentName2 | varchar(100) | YES |  |

| Status | smallint | NO |  |

| ParentID1 | binary(18) | YES |  |

| BillingType | tinyint | YES |  |

| ParentName1 | varchar(100) | YES |  |

| ParentID0 | binary(18) | YES |  |

| ParentName0 | varchar(100) | YES |  |

| ServiceNameOrder | varchar(505) | YES |  |

| Type | smallint | NO |  |

| CorporationID | binary(18) | NO |  |

| IsSubContracted | bit | YES |  |

## dbo.QBSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| SourceID | binary(18) | NO |  |

| SourceName | varchar(150) | NO |  |

| CorporationID | binary(18) | NO |  |

| SourceType | smallint | NO |  |

## dbo.RadiantMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BrandName | varchar(50) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| StoreFranchiseeID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| MappingType | tinyint | YES |  |

## dbo.RateGallon

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| TransactionID | binary(18) | NO |  |

| Rate | decimal | YES |  |

| Gallons | decimal | YES |  |

## dbo.RateHistory

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| Rate | decimal | NO |  |

| PerDiem | decimal | YES |  |

| Status | tinyint | NO |  |

## dbo.ReceiptSalesEntry

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| JournalEntryID | binary(18) | NO |  |

| SalesEntryID | binary(18) | NO |  |

## dbo.Reconciliation

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ReconciliationDate | datetime2 | NO |  |

| StatementDate | datetime2 | NO |  |

| OpeningBalance | decimal | YES |  |

| StatementBalance | decimal | NO |  |

| AccountID | binary(18) | NO |  |

| Status | tinyint | YES | (NULL) |

| Type | smallint | YES |  |

| StartDate | datetime2 | YES |  |

| EndDate | datetime2 | YES |  |

| TotalFeeds | int | YES |  |

| Matched | int | YES |  |

| UnMatched | int | YES |  |

| IsAttachment | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

## dbo.ReconciliationDailySalesConfig

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| DebitRefID | binary(18) | YES |  |

| LineID | binary(18) | NO |  |

| LineName | nvarchar(100) | YES |  |

| DeptType | smallint | YES |  |

| EnableMultiple | int | YES |  |

## dbo.ReconciliationDailySalesDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| DeptType | smallint | YES |  |

| EnableMultiple | bit | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| Status | smallint | NO |  |

| DebitCredit | bit | NO |  |

| Amount | decimal | NO |  |

| AccountID | binary(18) | NO |  |

| Memo | varchar(500) | YES |  |

| TranSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| BankTransactionRefId | varchar(50) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| JournalEntryID | binary(18) | NO |  |

| ParentID | binary(18) | YES |  |

| VoidDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| IsBankTransactionRefId | tinyint | YES |  |

| IsAdjustment | bit | YES |  |

| ActualSourceType | smallint | YES |  |

| ActualParentSourceType | smallint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| JSourceID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| IsSplitEnabled1 | bit | YES |  |

## dbo.ReconciliationDetail

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ReconciliationID | binary(18) | NO |  |

| TransactionID | binary(18) | NO |  |

## dbo.ReconciliationDSDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| LineID | binary(18) | YES |  |

| LineName | nvarchar(100) | YES |  |

| DeptType | smallint | YES |  |

| EnableMultiple | bit | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| Status | smallint | NO |  |

| DebitCredit | bit | NO |  |

| Amount | decimal | NO |  |

| AccountID | binary(18) | NO |  |

| Memo | varchar(500) | YES |  |

| TranSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| BankTransactionRefId | varchar(50) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| JournalEntryID | binary(18) | NO |  |

| ParentID | binary(18) | YES |  |

| VoidDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| IsBankTransactionRefId | tinyint | YES |  |

| IsAdjustment | bit | YES |  |

| ActualSourceType | smallint | YES |  |

| ActualParentSourceType | smallint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| JSourceID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| IsSplitEnabled1 | bit | YES |  |

## dbo.ReconciliationFullViewLoad

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| TransactionID | binary(18) | NO |  |

| JournalID | binary(18) | YES |  |

| Type | varchar(6) | NO |  |

| PaymentOrReceiptType | varchar(8) | NO |  |

| Description | varchar(151) | YES |  |

| Date | datetime2 | NO |  |

| Number | varchar(100) | NO |  |

| Amount | decimal | NO |  |

| Receipt | decimal | NO |  |

| Payment | decimal | NO |  |

| IsSelected | bit | YES |  |

| IsFromBankFeeds | bit | YES |  |

| Status | varchar(5) | NO |  |

| SourceTypeID | smallint | YES |  |

| ParentSourceTypeID | smallint | YES |  |

| SourceTypeName | varchar(18) | YES |  |

| SourceType | varchar(100) | YES |  |

| TransNumber | int | NO |  |

| Memo | varchar(500) | NO |  |

| PaymentMethodID | binary(18) | YES |  |

| ActualSourceType | smallint | YES |  |

| ActualParentSourceType | smallint | YES |  |

| AccountID | binary(18) | NO |  |

| VoidDate | datetime2 | YES |  |

| TStatus | smallint | NO |  |

| SubSourceTypeName | varchar(50) | YES |  |

## dbo.ReconciliationMainTransListDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| Status | smallint | NO |  |

| DebitCredit | bit | NO |  |

| Amount | decimal | YES |  |

| AccountID | binary(18) | NO |  |

| Memo | varchar(500) | YES |  |

| TranSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| BankTransactionRefId | varchar(50) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(50) | YES |  |

| JournalEntryID | binary(18) | NO |  |

| ParentID | binary(18) | YES |  |

| VoidDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| IsBankTransactionRefId | tinyint | YES |  |

| PaymentMethodID | binary(18) | YES |  |

| IsAdjustment | bit | YES |  |

| ActualSourceType | smallint | YES |  |

| ActualParentSourceType | smallint | YES |  |

| ReferenceType | smallint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| BaseDebitCredit | bit | NO |  |

| EntryDate1 | datetime2 | YES |  |

| JSourceID | binary(18) | YES |  |

| ApprovalStatus | int | YES |  |

## dbo.ReconciliationMerge

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReconciliationID | binary(18) | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

## dbo.ReconciliationMergeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReconciliationMergeID | bigint | YES |  |

| DailySalesLineID | binary(18) | YES |  |

| MergeType | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.ReconciliationMergeView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| TransactionID | binary(18) | YES |  |

| JournalID | varbinary(18) | NO |  |

| Type | varchar(6) | NO |  |

| PaymentOrReceiptType | varchar(8) | NO |  |

| Description | varchar(8000) | NO |  |

| Date | datetime2 | NO |  |

| Number | varchar(8000) | NO |  |

| Amount | decimal | YES |  |

| Receipt | decimal | YES |  |

| Payment | decimal | YES |  |

| SourceTypeName | varchar(10) | NO |  |

| IsSelected | bit | YES |  |

| Memo | varchar(8000) | NO |  |

| SubSourceTypeName | nvarchar(4000) | YES |  |

| StrTransactionID | varchar(8000) | YES |  |

| ReconciliationID | binary(18) | YES |  |

| AccountID | binary(18) | NO |  |

| DeptType | smallint | YES |  |

| IsAdjustment | bit | YES |  |

## dbo.ReconciliationTransLisDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| Status | smallint | NO |  |

| DebitCredit | bit | NO |  |

| Amount | decimal | NO |  |

| AccountID | binary(18) | NO |  |

| Memo | varchar(500) | YES |  |

| TranSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| BankTransactionRefId | varchar(50) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(25) | YES |  |

| JournalEntryID | binary(18) | NO |  |

| ParentID | binary(18) | YES |  |

| VoidDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| IsBankTransactionRefId | tinyint | YES |  |

| PaymentMethodID | binary(18) | YES |  |

| IsAdjustment | bit | YES |  |

| ActualSourceType | smallint | YES |  |

| ActualParentSourceType | smallint | YES |  |

| ReferenceType | smallint | YES |  |

## dbo.ReconciliationTransListDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| Status | smallint | NO |  |

| DebitCredit | bit | NO |  |

| Amount | decimal | NO |  |

| AccountID | binary(18) | NO |  |

| Memo | varchar(500) | YES |  |

| TranSourceType | smallint | YES |  |

| SourceID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| BankTransactionRefId | varchar(50) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | smallint | YES |  |

| EntryDate | datetime2 | NO |  |

| EntryNumber | varchar(100) | YES |  |

| ReferenceNumber | varchar(50) | YES |  |

| JournalEntryID | binary(18) | NO |  |

| ParentID | binary(18) | YES |  |

| VoidDate | datetime2 | YES |  |

| TransNumber | int | YES |  |

| IsBankTransactionRefId | tinyint | YES |  |

| PaymentMethodID | binary(18) | YES |  |

| IsAdjustment | bit | YES |  |

| ActualSourceType | smallint | YES |  |

| ActualParentSourceType | smallint | YES |  |

| ReferenceType | smallint | YES |  |

| ReconciliationID | binary(18) | YES |  |

| JSourceID | binary(18) | YES |  |

## dbo.ReconciliationViewList

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountTypeName | varchar(50) | NO |  |

| Account | varchar(127) | YES |  |

| StatementDate | datetime2 | YES |  |

| RecID | binary(18) | YES |  |

| RecColorCode | int | NO |  |

| AccountTypeID | binary(18) | NO |  |

## dbo.ReconciliationViewListDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| AccountID | binary(18) | NO |  |

| Account | varchar(127) | YES |  |

| AccountTypeName | varchar(50) | NO |  |

| CorporationID | binary(18) | YES |  |

| RecYear | int | YES |  |

| Jan | varchar(112) | YES |  |

| Feb | varchar(112) | YES |  |

| Mar | varchar(112) | YES |  |

| Apr | varchar(112) | YES |  |

| May | varchar(112) | YES |  |

| Jun | varchar(112) | YES |  |

| Jul | varchar(112) | YES |  |

| Aug | varchar(112) | YES |  |

| Sep | varchar(112) | YES |  |

| Oct | varchar(112) | YES |  |

| Nov | varchar(112) | YES |  |

| Dec | varchar(112) | YES |  |

| AccountTypeID | binary(18) | NO |  |

## dbo.Register

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| StoreFranchiseeID | binary(18) | NO |  |

| Status | smallint | NO |  |

## dbo.Remind

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Type | smallint | NO |  |

| Interval | varchar(50) | YES | (NULL) |

| Status | smallint | NO |  |

## dbo.RepayAuditInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AuditID | bigint | NO |  |

| ClientID | varchar(250) | YES |  |

| ClientSecret | varchar(250) | YES |  |

| AccountID | binary(18) | YES |  |

| UpdateColumns | varchar(10) | YES |  |

## dbo.RepayConfig

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| ClientID | varchar(250) | YES |  |

| ClientSecretID | varchar(250) | YES |  |

| Status | tinyint | YES |  |

## dbo.Repetitive

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceType | smallint | NO |  |

| ParentID | binary(18) | YES |  |

| SourceID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| FrequencyID | binary(18) | YES | (NULL) |

| RemindID | binary(18) | YES | (NULL) |

| RemindStatus | bit | NO |  |

| NextDate | date | NO |  |

| EndDate | date | YES |  |

| Description | varchar(200) | YES | (NULL) |

| SendEmail | bit | NO |  |

| IsAutomatic | bit | NO |  |

| Status | smallint | NO |  |

| RemindNo | smallint | YES | (NULL) |

| CorporationID | binary(18) | YES | (NULL) |

| PaidDate | date | YES | (NULL) |

| Email | varchar(100) | YES |  |

| IsAccrual | smallint | YES |  |

| ForMonthEndDate | bit | YES |  |

| PaymentMethodID | binary(18) | YES |  |

| ContractID | binary(18) | YES |  |

## dbo.RepetitiveCreditTerm

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CreditDays | binary(18) | YES |  |

| SourceDate | date | YES |  |

| SourceID1 | binary(18) | YES |  |

| SourceID2 | binary(18) | YES |  |

| AccContractID | binary(18) | YES |  |

## dbo.RepetitiveTransaction

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| AccountID | binary(18) | NO |  |

| TargetID | binary(18) | NO |  |

| ParentID | binary(18) | YES | (NULL) |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| TransactionDate | datetime2 | NO |  |

| ReferenceNumber | varchar(25) | YES | (NULL) |

| Memo | varchar(-1) | YES | (NULL) |

| Status | smallint | NO |  |

| SourceID | binary(18) | YES | (NULL) |

| SourceType | smallint | YES | (NULL) |

| StoreID | binary(18) | YES | (NULL) |

| FranchiseeID | binary(18) | YES | (NULL) |

| CostcenterID | binary(18) | YES | (NULL) |

| XmlMemo | varchar(-1) | YES |  |

| EntryDate | datetime2 | YES | (NULL) |

| EntryNumber | varchar(50) | YES | (NULL) |

| ReferenceMode | smallint | YES | (NULL) |

| Order | smallint | YES | (NULL) |

## dbo.RepetitiveTransactionInvoice

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| InvoiceID | binary(18) | YES |  |

| Hrs | decimal | YES |  |

| Rate | decimal | YES |  |

| TaxRate | decimal | YES |  |

| SourceID | binary(18) | YES |  |

| Status | tinyint | YES |  |

## dbo.Report

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ReportName | varchar(50) | NO |  |

| ReportCategory | varchar(50) | YES | (NULL) |

| ConfigurationXml | varchar(-1) | YES |  |

| ReportCode | varchar(50) | YES | (NULL) |

| ReportAction | varchar(100) | YES | (NULL) |

## dbo.ReportCustomization

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| ReportMenuID | binary(18) | YES |  |

| ViewTransactionType | int | YES |  |

| ReportExpandCollapse | int | YES |  |

| ColumnsBy | int | YES |  |

| ReportTitle | varchar(50) | YES |  |

| ShowNegFigures | int | YES |  |

| InRed | bit | YES |  |

| Divide1000 | bit | YES |  |

| WOCents | bit | YES |  |

| ExcludeZero | bit | YES |  |

| CustomizeString | varchar(-1) | YES |  |

| WithOutTrans | bit | YES |  |

| WithOutTransNullified | bit | YES |  |

| WithoutZeroTransaction | bit | YES |  |

| WithOutAccountCode | bit | YES |  |

| AccrualCashBasis | int | YES |  |

| AccountID | binary(18) | YES |  |

| ReportSummaryDetails | int | YES |  |

| IsFromSch | bit | YES |  |

| DisplayAccountCodeSeperately | bit | YES |  |

| VendorID | varchar(50) | YES |  |

| ShortOrder | int | YES |  |

| ShortBy | int | YES |  |

| status | int | YES |  |

| TransactionType | int | YES |  |

| AgingGroupby | int | YES |  |

| AgingBydays | varchar(50) | YES |  |

## dbo.ReportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| ReportSaveID | int | NO |  |

| Name | varchar(200) | YES |  |

| Value | varchar(300) | YES |  |

## dbo.ReportGroup

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Status | smallint | NO |  |

| ClientID | binary(18) | NO |  |

| Description | varchar(200) | YES |  |

| Type | smallint | YES |  |

## dbo.ReportLine

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| ReportLlineCode | varchar(12) | NO |  |

| ReportLineDescription | varchar(100) | NO |  |

| Status | tinyint | NO |  |

| SourceType | tinyint | YES | (NULL) |

## dbo.ReportParametersForSch

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| ReportScheduleInfoID | bigint | NO |  |

| SourceID | bigint | YES |  |

| SourceType | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.ReportScheduleInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ManagementGroupID | varchar(100) | YES |  |

| FormatType | smallint | YES |  |

| FilesOption | smallint | YES |  |

| Status | smallint | YES |  |

| MenuInformationID | bigint | YES |  |

## dbo.ReportsSave

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| Name | varchar(100) | NO |  |

| Url | varchar(1000) | NO |  |

| Status | tinyint | YES |  |

| UserID | binary(18) | NO |  |

| HelpUl | varchar(1000) | YES |  |

| MenuID | varchar(50) | YES |  |

| CorporationID | binary(18) | YES |  |

| isExpandCollapse | varchar(20) | YES |  |

| ViewTransactionType | varchar(100) | YES |  |

| ReportExpandCollapse | varchar(2) | YES |  |

| UserDefinedMenuID | binary(18) | YES |  |

## dbo.ReqBillForPayment

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReqID | bigint | YES |  |

| BillInfoID | bigint | YES |  |

| PaidAmount | decimal | YES |  |

| Discount | decimal | YES |  |

## dbo.Role

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Description | varchar(100) | YES | (NULL) |

| ClientID | binary(18) | YES |  |

| Status | smallint | YES |  |

| ParentID | binary(18) | YES |  |

| IsPrintCheckEnabled | bit | YES |  |

| IsSignatureIncludedForCheck | bit | YES |  |

| IsEmailsLogon | bit | YES |  |

| IsDailySalesMandatory | bit | YES |  |

| RoleLevel | int | YES |  |

| DashboardPrivilege | bit | YES |  |

## dbo.SalesEntry

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| StoreID | binary(18) | NO |  |

| FranchiseeID | binary(18) | YES | (NULL) |

| StoreShiftID | binary(18) | YES | (NULL) |

| SalesEntryType | smallint | YES | (NULL) |

| SalesDate | date | NO |  |

| DayType | smallint | NO |  |

| DayDescription | varchar(50) | YES | (NULL) |

| ApprovedBy | binary(18) | YES | (NULL) |

| Weather | varchar(50) | YES | (NULL) |

| Status | bigint | YES | (NULL) |

| UserAmountAvailable | decimal | YES | (NULL) |

| Difference | decimal | YES | (NULL) |

| CreatedDate | datetime2 | YES | (sysdatetime()) |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

## dbo.SalesEntryDetail

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SalesEntryID | binary(18) | NO |  |

| RegisterID | binary(18) | YES | (NULL) |

| SourceType | smallint | NO |  |

| SourceID | binary(18) | YES | (NULL) |

| Amount | decimal | NO |  |

| Quantity | decimal | YES | (NULL) |

## dbo.SalesEntryPayin

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SaleEntryID | binary(18) | NO |  |

| SourceType | smallint | NO |  |

| SourceID | binary(18) | YES | (NULL) |

| Amount | decimal | NO |  |

| TransactionsNumber | int | NO |  |

## dbo.SalesEntryPayout

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SalesEntryID | binary(18) | NO |  |

| PurposeID | binary(18) | NO |  |

| Amount | decimal | NO |  |

| Description | varchar(100) | YES | (NULL) |

| AccountID | binary(18) | YES | (NULL) |

| Order | tinyint | YES | (NULL) |

## dbo.SalesEntryRegister

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SalesEntryID | binary(18) | NO |  |

| RegisterID | binary(18) | NO |  |

| CustomerCount | smallint | NO |  |

| ToyCount | int | YES |  |

## dbo.SalesLaborInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| SalesEntryID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| TimePeriodBegins | varchar(50) | YES |  |

| TransCount | int | YES |  |

| NetSales | decimal | YES |  |

| LaborHrs | decimal | YES |  |

| LaborCost | decimal | YES |  |

| Status | smallint | YES |  |

## dbo.SalesLaborSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ClientID | binary(18) | YES |  |

| Name | varchar(100) | YES |  |

| Status | smallint | YES |  |

| SettingsOrder | smallint | YES |  |

## dbo.SalesSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| Name | varchar(100) | NO |  |

| Percentage | decimal | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.Scheduler

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Frequency | bigint | YES |  |

| Interval | varchar(50) | YES |  |

| OnTime | varchar(50) | YES |  |

| TimeZoneID | bigint | YES |  |

| ReportDateRange | varchar(50) | YES |  |

| DefinedReportName | varchar(255) | YES |  |

| ClientID | binary(18) | YES |  |

| Status | smallint | YES |  |

| CreatedBy | binary(18) | NO |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| ModifiedDate | datetime2 | YES |  |

| LastSent | datetime2 | YES |  |

| RunDate | datetime2 | YES |  |

| CustomizeStringForISParams | varchar(-1) | YES |  |

| CustomizeStringForCustomParams | varchar(-1) | YES |  |

| CustomizeStringForFigureFormat | varchar(-1) | YES |  |

| ESTTime | varchar(10) | YES |  |

| MENUID | binary(18) | YES |  |

| ReportType | int | YES |  |

| AgingDays | varchar(50) | YES |  |

| AgingCustomDays | int | YES |  |

| AgingGroupBy | int | YES |  |

## dbo.SchedulerEmailInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SchedulerID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| EmailID | varchar(100) | YES |  |

| EmailType | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.SchedulerLog

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SchedulerID | bigint | NO |  |

| Remarks | varchar(2000) | YES |  |

| LogStartDate | datetime2 | YES |  |

| LogEndDate | datetime2 | YES |  |

| Status | smallint | NO |  |

## dbo.ServiceInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| NameID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| NameType | tinyint | YES |  |

| EndClientName | varchar(100) | YES |  |

| EndClientLocation | varchar(100) | YES |  |

| EndClientDivisionID | binary(18) | YES |  |

| BillingType | tinyint | YES |  |

| DivisionID | binary(18) | YES |  |

| LocationID | bigint | YES |  |

| StartDate | datetime | YES |  |

| ProposedEndDate | datetime | YES |  |

| ActualEndDate | datetime | YES |  |

| IsSubContracted | bit | YES |  |

## dbo.ServiceInfoDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ServiceInfoID | binary(18) | NO |  |

| PurchaseRate | decimal | YES |  |

| PurchaseAccount | binary(18) | YES |  |

| PurchaseDescription | varchar(250) | YES |  |

| VendorID | binary(18) | YES |  |

## dbo.SignatureDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(-1) | YES |  |

| CorporationBankDetailsID | binary(18) | NO |  |

| Path | varchar(500) | YES |  |

| status | tinyint | YES |  |

| isDefault | bit | YES |  |

| Order | int | YES |  |

| CorporationID | binary(18) | YES |  |

| FileName | varchar(300) | YES |  |

## dbo.SlabDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SourceID | int | YES |  |

| SourceType | tinyint | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | tinyint | YES |  |

| Amount | decimal | YES |  |

| Status | tinyint | YES |  |

## dbo.State

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CountryID | bigint | NO |  |

| Code | char(4) | NO |  |

| Name | varchar(75) | NO |  |

| Status | tinyint | NO |  |

| SUI | tinyint | YES |  |

| SDI | tinyint | YES |  |

## dbo.Stock

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SDate | datetime2 | YES |  |

| CorporationID | binary(18) | YES |  |

| ItemID | binary(18) | YES |  |

| Quantity | decimal | YES |  |

| Rate | decimal | YES |  |

| Type | smallint | YES |  |

| SourceID | bigint | YES |  |

| Status | smallint | YES |  |

## dbo.Store

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| CustomerID | varchar(15) | YES | (NULL) |

| ContactID | binary(18) | YES | (NULL) |

| AddressID | binary(18) | YES | (NULL) |

| BaseRent | decimal | YES | (NULL) |

| TaxEscrow | decimal | YES | (NULL) |

| Deductions | decimal | YES | (NULL) |

| PercentageRent | decimal | YES | (NULL) |

| StoreDateStart | date | YES | (NULL) |

| StoreDateEnd | date | YES | (NULL) |

| SalesType | smallint | NO |  |

| Status | smallint | NO |  |

| PcNo | varchar(15) | YES | (NULL) |

| ParentStoreID | binary(18) | YES |  |

| DefaultStore | smallint | YES |  |

| PMSType | smallint | YES |  |

| BookkeeperMail | varchar(400) | YES |  |

| TotalAvailableRooms | int | YES |  |

| PropertyType | smallint | YES |  |

| ServiceType | smallint | YES |  |

| BrandName | smallint | YES |  |

| DefaultSettings | smallint | YES |  |

| SaleStartDate | date | YES | (NULL) |

## dbo.StoreCustomer

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BusinessID | binary(18) | NO |  |

| StoreFranchiseeID | binary(18) | NO |  |

| OutstandingAmount | decimal | NO |  |

| Status | tinyint | YES | (NULL) |

## dbo.StoreFranchisee

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| StoreID | binary(18) | NO |  |

| FranchiseeID | binary(18) | NO |  |

| ID | binary(18) | NO |  |

| Status | tinyint | YES | (NULL) |

| SalesType | bit | YES | (0x00) |

## dbo.StoreProduct

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| StoreID | binary(18) | NO |  |

| FranchiseeProductID | binary(18) | NO |  |

| SalesTax | decimal | YES | (NULL) |

| MealTax | decimal | YES | (NULL) |

| LocalTax | decimal | YES | (NULL) |

| OtherTax | decimal | YES | (NULL) |

| Status | tinyint | YES | (NULL) |

| AdvertisingFee | decimal | NO |  |

| FranchiseeFee | decimal | NO |  |

| Order | tinyint | YES | (NULL) |

## dbo.StoreShift

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ShiftName | varchar(50) | NO |  |

| StoreFranchiseeID | binary(18) | NO |  |

| ShiftTimeStart | time | NO |  |

| ShiftTimeEnd | time | NO |  |

| Status | smallint | NO |  |

## dbo.StoreView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| StoreNameOrder | varchar(255) | YES |  |

| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| Name | varchar(56) | NO |  |

| ActualName | varchar(50) | NO |  |

| CustomerID | varchar(15) | YES |  |

| PcNo | varchar(15) | YES |  |

| Status | smallint | NO |  |

| S2ID | binary(18) | YES |  |

| S3ID | binary(18) | YES |  |

| S4ID | binary(18) | YES |  |

| S5ID | binary(18) | YES |  |

| ContactID | binary(18) | YES |  |

| DefaultStore | smallint | YES |  |

| AddressID | binary(18) | YES |  |

| SName2 | varchar(50) | YES |  |

| SName3 | varchar(50) | YES |  |

| SName4 | varchar(50) | YES |  |

| SName5 | varchar(50) | YES |  |

## dbo.STRDataImport

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| CorporationID | binary(18) | YES |  |

| FilePath | varchar(200) | YES |  |

| ImportDate | datetime2 | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

| StoreID | binary(18) | YES |  |

## dbo.STRDataImportDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| STRDataImportID | bigint | YES |  |

| SType | smallint | YES |  |

| SheetDate | datetime2 | YES |  |

| CorpVal | decimal | YES |  |

| CompetitiveVal | decimal | YES |  |

| IndexMPI | decimal | YES |  |

| IsPercentChange | bit | YES |  |

## dbo.sysdiagrams

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| name | nvarchar(128) | NO |  |

| principal_id | int | NO |  |

| diagram_id | int | NO |  |

| version | int | YES |  |

| definition | varbinary(-1) | YES |  |

## dbo.TaxGroup

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(50) | NO |  |

| Status | smallint | NO |  |

| ClientID | binary(18) | YES | (NULL) |

## dbo.TaxMapping

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| FranchiseeID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| DebitCredit | bit | YES |  |

## dbo.TaxMaster

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| Name | varchar(100) | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| Status | smallint | YES |  |

| TargetID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Rate | decimal | YES |  |

| Description | varchar(100) | YES |  |

## dbo.TempBankDeposit

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| BID | binary(18) | NO |  |

| SalesDate | datetime2 | YES |  |

## dbo.TempJournal

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| JID | binary(18) | NO |  |

| EntryDate | datetime2 | YES |  |

## dbo.TempPrintCheckDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| JournalEntryID | binary(18) | NO |  |

| UserID | binary(18) | NO |  |

| CheckNum | bigint | YES |  |

| CheckOrder | int | YES |  |

| CheckType | tinyint | YES |  |

## dbo.TempTableForBillPaymentAttachment

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| ReqID | nvarchar(100) | YES |  |

| JID | binary(18) | YES |  |

## dbo.TemptableForBulkPrint

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReqID | nvarchar(100) | NO |  |

| JournalID | binary(18) | YES |  |

| CorpID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| CheckNo | varchar(100) | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| Status | smallint | YES |  |

| CheckOrder | int | YES |  |

## dbo.TempTbl

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

## dbo.TempVer

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | YES |  |

| Date | datetime2 | YES |  |

## dbo.TimeByConsulatanceDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| TimeInfoID | binary(18) | NO |  |

| Billable | bit | NO |  |

| ItemID | binary(18) | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

| IsBilled | bit | YES |  |

## dbo.TimeExpenseInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| WeekDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| TimeSheetDate | datetime2 | YES |  |

## dbo.TimeInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| ResourceID | binary(18) | NO |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| Status | tinyint | NO |  |

| Type | tinyint | NO |  |

| ISCumulative | bit | NO |  |

| FreqID | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| IsLinkShared | bit | YES |  |

| CreatedBy | binary(18) | YES |  |

## dbo.TimeInfoDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| TimeInfoID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| InfoDate | datetime2 | YES |  |

| Description | varchar(150) | YES |  |

| Value | decimal | NO |  |

| Billable | bit | NO |  |

| IsBilled | bit | YES |  |

| Order | tinyint | NO |  |

| Status | tinyint | NO |  |

| IsPayroll | bit | YES |  |

| IsPaid | bit | YES |  |

## dbo.TimeInfosWithItems

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| TimeSheetDate | datetime2 | YES |  |

| TimeInfoDetailID | binary(18) | NO |  |

## dbo.TimeInfoViewInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| ResourceID | binary(18) | NO |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| Status | tinyint | NO |  |

| Type | tinyint | NO |  |

| ISCumulative | bit | NO |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| IsLinkShared | bit | YES |  |

| CreatedBy | binary(18) | YES |  |

| Hrs | decimal | YES |  |

| IsBillableCheck | int | YES |  |

| IsPaidCheck | int | YES |  |

## dbo.Timesheet

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| WeekDate | datetime2 | NO |  |

| IsLinkShared | tinyint | NO |  |

| Message | varchar(1000) | YES |  |

| EmailID | varchar(100) | YES |  |

| Type | tinyint | NO |  |

| Status | tinyint | NO |  |

| CreatedDate | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

## dbo.TimesheetDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| TimesheetID | binary(18) | NO |  |

| ProjectID | binary(18) | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| Description | varchar(150) | YES |  |

| Billable | bit | NO |  |

| Day1 | decimal | YES |  |

| Day2 | decimal | YES |  |

| Day3 | decimal | YES |  |

| Day4 | decimal | YES |  |

| Day5 | decimal | YES |  |

| Day6 | decimal | YES |  |

| Day7 | decimal | YES |  |

| IsBilled | bit | YES |  |

| Order | tinyint | NO |  |

| WageCostStatus | tinyint | YES |  |

## dbo.TimeSheetInfoDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| InfoDate | datetime2 | YES |  |

| Hrs | decimal | YES |  |

| IsBilled | bit | YES |  |

| IsPayroll | bit | YES |  |

| IsPaid | bit | YES |  |

| SourceType | tinyint | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| TimeSheetID | binary(18) | NO |  |

## dbo.TimeSheetInfosWithItems

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| WeekDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| TimeSheetDate | datetime2 | YES |  |

## dbo.TimeSheetInvoice

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| WeekDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| TimeSheetDate | datetime2 | YES |  |

## dbo.TimeSheetStatusInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| TimeSheetDetailID | binary(18) | YES |  |

| Date | datetime2 | YES |  |

| Type | tinyint | YES |  |

| TimesheetID | binary(18) | YES |  |

| PayrollEmployeeID | binary(18) | YES |  |

## dbo.TimeSheetsView

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| Rate | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

## dbo.TimeZone

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| Name | varchar(50) | YES |  |

| Code | varchar(10) | YES |  |

| CreatedOn | datetime2 | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedOn | datetime2 | YES |  |

| ModifiedBy | binary(18) | YES |  |

| Status | smallint | YES |  |

| IsDefault | bit | YES | ((0)) |

## dbo.trans

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| SourceType | smallint | YES |  |

## dbo.Transaction

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| AccountID | binary(18) | NO |  |

| JournalEntryID | binary(18) | NO |  |

| ParentID | binary(18) | YES |  |

| Amount | decimal | NO |  |

| DebitCredit | bit | NO |  |

| TransactionDate | datetime2 | NO |  |

| ReferenceNumber | varchar(50) | YES |  |

| Memo | varchar(500) | YES |  |

| Status | smallint | NO |  |

| SourceID | binary(18) | YES |  |

| SourceType | smallint | YES |  |

| StoreID | binary(18) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| CostcenterID | binary(18) | YES |  |

| XmlMemo | varchar(200) | YES |  |

| ReconciliationID | binary(18) | YES |  |

| Order | smallint | YES |  |

| ReconStatus | tinyint | YES |  |

| TargetType | smallint | YES |  |

| TargetID | binary(18) | YES |  |

| ReferenceID | binary(18) | YES |  |

| Billable | bit | YES |  |

| IsBilled | bit | YES |  |

| IsBankTransactionRefId | tinyint | YES |  |

| BankTransactionRefId | varchar(50) | YES |  |

| TID | bigint | NO |  |

| MerchantReconRefID | varchar(500) | YES |  |

## dbo.TransactionDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| TransactionID | binary(18) | NO |  |

| ReferenceID | binary(18) | NO |  |

| ReferenceType | smallint | NO |  |

| Amount | decimal | NO |  |

| Status | tinyint | YES |  |

| Date | datetime2 | YES |  |

| SourceID | binary(18) | YES |  |

| TargetID | binary(18) | YES |  |

| TargetType | int | YES |  |

## dbo.TransactionInvoice

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| InvoiceID | binary(18) | YES |  |

| Hrs | decimal | YES |  |

| Rate | decimal | YES |  |

| TaxRate | decimal | YES |  |

| SourceID | binary(18) | YES |  |

| Status | tinyint | YES |  |

| AccContractID | binary(18) | YES |  |

| BaseDebitCredit | bit | YES |  |

## dbo.TransactionReference

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ReferenceID | binary(18) | NO |  |

| ApplicableFrom | varchar(50) | YES |  |

| RefType | int | YES |  |

| Amount | decimal | YES |  |

| Type | tinyint | YES |  |

| Months | int | YES |  |

| EqualCustomType | varchar(10) | YES |  |

| ReferenceToID | binary(18) | YES |  |

| IsSingle | bit | YES |  |

| Status | tinyint | YES |  |

## dbo.TransactionReferenceDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| TransactionRefernceID | binary(18) | YES |  |

| NameID | binary(18) | YES |  |

| Month | varchar(50) | YES |  |

| Year | varchar(50) | YES |  |

| Amount | decimal | YES |  |

| Description | varchar(500) | YES |  |

| Status | tinyint | YES |  |

## dbo.TransactionsList

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| TransNumber | int | YES |  |

| EntryDate | datetime2 | NO |  |

| Number | varchar(50) | YES |  |

| Amount | decimal | YES |  |

| AccountName | varchar(127) | YES |  |

| CLR | varchar(1) | NO |  |

| CorporationName | varchar(100) | NO |  |

| StoreName | varchar(50) | YES |  |

| StoreID | binary(18) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Memo | varchar(500) | YES |  |

| DueDate | datetime2 | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| Balance | decimal | NO |  |

| DebitCredit | bit | NO |  |

| TransID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| FranchiseeName | varchar(50) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| TSourceID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AccountStatus | tinyint | NO |  |

| AccountTypeID | binary(18) | NO |  |

| BankType | varchar(1) | NO |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TSourceType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransactionDate | datetime2 | NO |  |

| Order | smallint | YES |  |

| JESourceID | binary(18) | YES |  |

| Name | varchar(100) | NO |  |

## dbo.TransactionTaxInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| TransactionID | binary(18) | NO |  |

| UseTaxRateID | bigint | YES |  |

| UseTaxRateID2 | bigint | YES |  |

| UseTaxDetailsID | bigint | YES |  |

| Rate1 | decimal | YES |  |

| Rate2 | decimal | YES |  |

| Status | smallint | NO |  |

| UseTaxID | bigint | YES |  |

## dbo.UnBilledTimeSheet

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| SourceType | tinyint | NO |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| Rate | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| Billable | bit | NO |  |

## dbo.UnPaidBillTimeSheet

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Type | tinyint | NO |  |

| CorporationID | binary(18) | NO |  |

| Status | tinyint | NO |  |

| ID | binary(18) | NO |  |

| EmployeeID | binary(18) | NO |  |

| ProjectID | binary(18) | NO |  |

| ServiceInfoID | binary(18) | YES |  |

| SourceID | binary(18) | YES |  |

| FromDate | datetime2 | NO |  |

| ToDate | datetime2 | NO |  |

| HRs | decimal | YES |  |

| ProfitCenterID | binary(18) | YES |  |

| Rate | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

## dbo.UOM

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| ClientID | binary(18) | YES |  |

| UOMType | binary(18) | YES |  |

| UOMName | varchar(50) | YES |  |

| ShortName | varchar(10) | YES |  |

| Status | smallint | YES |  |

## dbo.User

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserName | varchar(50) | NO |  |

| Password | varchar(200) | YES |  |

| Salutation | tinyint | YES |  |

| FirstName | varchar(50) | NO |  |

| LastName | varchar(50) | YES | (NULL) |

| MiddleName | varchar(50) | YES | (NULL) |

| ContactID | binary(18) | YES | (NULL) |

| AddressID | binary(18) | YES | (NULL) |

| ParentUserID | binary(18) | YES | (NULL) |

| Type | smallint | NO |  |

| Status | smallint | NO |  |

| RoleID | binary(18) | YES |  |

| LoginCheck | smallint | NO | (0x00) |

| LastLoginDate | datetime2 | YES | (NULL) |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedDate | datetime | YES |  |

| HintQuestionID | binary(18) | YES |  |

| Answer | varchar(50) | YES |  |

| IsFirstLogin | bit | YES |  |

| DOB | varchar(10) | YES |  |

| IsDashboardDefault | bit | YES |  |

| COASettings | tinyint | YES |  |

| Token | varchar(200) | YES |  |

| IsApprove | bit | YES |  |

| EnableApproval | bit | YES |  |

| StatsMandatory | bit | YES |  |

| EnableWhiteCheckPrinting | bit | YES |  |

| EnableOTPAuthentication | bit | YES |  |

| WithSignature | bit | YES |  |

| IsEmailLog | bit | YES |  |

| ReportTo | binary(18) | YES |  |

| ClientID | binary(18) | YES |  |

| UserLevel | smallint | YES |  |

| ApprovalType | smallint | YES |  |

| CheckPrintFormatTypeID | smallint | YES |  |

| isYodleeRegistered | smallint | YES |  |

| IsBookkeeper | smallint | YES |  |

| EnableDebitMemoCheckPrint | bit | YES |  |

| ShowVendorAccountNumberInStubs | bit | YES |  |

| PrintBlankCheck | bit | YES |  |

| BankingPreferenceTypeID | smallint | YES |  |

| IsInvoiceDateEnabled | bit | YES |  |

| EnableCheckNumPrint | bit | YES |  |

| EnableRePrint | bit | YES |  |

| EnablePrintCheckBillpayment | bit | YES |  |

| DashboardOrder | smallint | YES |  |

| EmailToBePrint | bit | YES |  |

## dbo.UserACHDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| ACHType | smallint | YES |  |

| UserType | smallint | YES |  |

| MainUserID | binary(18) | YES |  |

| ACHEmails | bit | YES |  |

| PRoviderType | smallint | YES |  |

| ACHAccess | smallint | YES | (NULL) |

| EFTAccess | smallint | YES | (NULL) |

## dbo.UserCheckFormatSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| WhiteCheckCountryPref | smallint | YES |  |

| PrePrintCheckCountryPref | smallint | YES |  |

| WhiteStubType | smallint | YES |  |

## dbo.UserCorporation

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| CorpSetting | varchar(120) | YES |  |

## dbo.UserCorporationAutoMerge

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| CorporationID | binary(18) | YES |  |

| StoreID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| Type | smallint | YES |  |

| Status | smallint | YES |  |

| CreatedBy | binary(18) | YES |  |

| ModifiedBy | binary(18) | YES |  |

| CreatedDate | datetime2 | YES |  |

| ModifiedDate | datetime2 | YES |  |

## dbo.UserCorporationAutoMergeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AutoMergeID | bigint | YES |  |

| DailySalesLineID | binary(18) | YES |  |

| MergeType | smallint | YES |  |

| Status | smallint | YES |  |

## dbo.UserDefaultSignature

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| SignatureName | varchar(100) | NO |  |

| UserID | binary(18) | NO |  |

| Order | int | YES |  |

## dbo.UserDirectDepositDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| DDUserAccess | smallint | YES |  |

| UserType | smallint | YES |  |

| MainUserID | binary(18) | YES |  |

| DDEmails | bit | YES |  |

## dbo.UserEmail

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | NO |  |

| Subject | varchar(200) | NO |  |

| ToEmail | varchar(1000) | NO |  |

| CCEmail | varchar(1000) | YES |  |

| BccEmail | varchar(1000) | YES |  |

| AttachmentPath | varchar(2000) | YES |  |

| EmailContent | varchar(8000) | YES |  |

| CreatedDate | datetime2 | NO |  |

| ProcessDate | datetime2 | YES |  |

| SendDate | datetime2 | YES |  |

| SourceType | smallint | NO |  |

| Status | smallint | NO |  |

| ExceptionMsg | varchar(500) | YES |  |

| DisplayName | varchar(200) | YES |  |

| JournalEntryID | binary(18) | YES |  |

| ReplyTo | varchar(1000) | YES |  |

## dbo.UserGa

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CompanyName | varchar(50) | YES | (NULL) |

| IsClientCreation | bit | YES | (0x00) |

| ProfileSummary | varchar(1000) | YES |  |

| FederalID | varchar(50) | YES |  |

| AddressID | binary(18) | YES |  |

| LegalName | varchar(50) | YES |  |

| IsCorpLegal | bit | YES |  |

| YearsOfExp | varchar(50) | YES |  |

| KeySkills | varchar(500) | YES |  |

## dbo.UserPackages

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| PackageName | varchar(50) | NO |  |

| AFUserCount | int | YES |  |

| ClientCount | int | YES | (NULL) |

| BFUserCount | int | YES |  |

| ConsultantCount | int | YES |  |

| CorpCount | int | YES | (NULL) |

| PCCount | int | YES |  |

| PriceperExtraPC | decimal | YES |  |

| PricePerExtraUser | decimal | YES |  |

| PricePerExtraConsultant | decimal | YES |  |

| PriceperExtraCorp | decimal | YES |  |

| Amount | decimal | YES |  |

| DurationType | int | YES |  |

| FirmType | smallint | YES |  |

| PackageType | tinyint | YES |  |

| VisibleHome | bit | YES |  |

| Status | int | NO |  |

## dbo.UserPaidInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| PaidDate | datetime2 | NO |  |

| SubscriptionStartDate | datetime2 | NO |  |

| SubscriptionEndDate | datetime2 | NO |  |

| Amount | decimal | NO |  |

| CardNumber | varchar(16) | NO |  |

| EmailID | varchar(45) | YES | (NULL) |

| PhoneNumber | varchar(50) | YES | (NULL) |

| Name | varchar(100) | YES | (NULL) |

| PackageID | binary(18) | NO |  |

| SubscriptionID | binary(18) | NO |  |

| PaidInfoXML | varchar(-1) | YES |  |

## dbo.UserPreferenceSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | NO |  |

| SettingValue | smallint | YES |  |

| SettingType | binary(18) | YES |  |

| CreateDate | datetime2 | NO |  |

| ModifiedDate | datetime2 | NO |  |

| IsDailySales | smallint | YES |  |

| IsBill | smallint | YES |  |

| EnableStatistics | smallint | YES |  |

| IsPO | smallint | YES |  |

| Type | smallint | YES |  |

| IsEnable | bit | YES |  |

| Value | smallint | YES |  |

| IsAutoEmail | bit | YES |  |

| AutoEmailType | smallint | YES |  |

| IsWhiteCheckMulStubs | bit | YES |  |

| IsCorpLegalNameShow | bit | YES |  |

| IsAccountNameMulStubs | smallint | YES |  |

| DisplayVendor | smallint | YES |  |

| PreviewPanel | smallint | YES |  |

| PrePrintFormat | smallint | YES |  |

| EnableAutoAmountDistribution | smallint | YES |  |

| StateFormat | smallint | YES |  |

| AutoMemo | smallint | YES |  |

| IsConfirmDebit | bit | YES |  |

| EnableManualMemo | bit | YES |  |

| EnableCheckMemo | bit | YES |  |

| EnableBillNumber | bit | YES |  |

| EnableAccountNumber | bit | YES |  |

| PrePrintStubType | smallint | YES |  |

| EnableHeadAccount | bit | YES |  |

## dbo.UserProfitCenter

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| StoreID | binary(18) | YES |  |

| Status | smallint | YES |  |

| UserCorporationID | binary(18) | YES |  |

## dbo.UserQuickLinks

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| UserID | binary(18) | NO |  |

| MenuID | binary(18) | NO |  |

| Order | tinyint | YES |  |

| MenuItemName | varchar(80) | YES |  |

| Type | tinyint | YES |  |

## dbo.UserReportSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserID | binary(18) | NO |  |

| ConfigurationXml | varchar(-1) | YES |  |

| ReportName | varchar(50) | NO |  |

| ReportDesc | varchar(100) | YES |  |

| ReportGroupID | binary(18) | YES |  |

| ClientID | binary(18) | NO |  |

| ReportAction | varchar(50) | YES |  |

| ReportType | tinyint | YES |  |

| ViewTransactions | varchar(50) | YES |  |

| CorporationName | varchar(100) | YES |  |

## dbo.UserRole

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserID | binary(18) | NO |  |

| CorporationID | binary(18) | YES | (NULL) |

| RoleID | binary(18) | NO |  |

| Editable | bit | NO |  |

| AutomatedMessagesEnable | bit | NO |  |

| CorpSetting | varchar(120) | YES |  |

## dbo.UserSettings

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | NO |  |

| ProfitCenterType | tinyint | YES |  |

| PurposeType | tinyint | YES |  |

## dbo.UsersInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserName | varchar(50) | NO |  |

| Password | varchar(200) | YES |  |

| FirstName | varchar(50) | NO |  |

| LastName | varchar(50) | YES |  |

| MiddleName | varchar(50) | YES |  |

| UserType | smallint | NO |  |

| ParentUserType | smallint | YES |  |

| ClientID | binary(18) | YES |  |

| UserStatus | smallint | NO |  |

| UserStatus1 | smallint | YES |  |

| UserStatus2 | smallint | YES |  |

| UserStatus3 | smallint | YES |  |

| UserStatus4 | smallint | YES |  |

| ParentUserID1 | binary(18) | YES |  |

| ParentUserName1 | varchar(50) | YES |  |

| ParentUserID2 | binary(18) | YES |  |

| ParentUserName2 | varchar(50) | YES |  |

| ParentUserID3 | binary(18) | YES |  |

| ParentUserName3 | varchar(50) | YES |  |

| ParentUserID4 | binary(18) | YES |  |

| ParentUserName4 | varchar(50) | YES |  |

| RoleName | varchar(50) | YES |  |

| ContactNo | varchar(50) | YES |  |

| MobileNo | varchar(50) | YES |  |

| CreatedDate | datetime | YES |  |

| ContactID | binary(18) | YES |  |

| Email | varchar(100) | YES |  |

| IsApprove | bit | NO |  |

## dbo.UserSubscription

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| UserID | binary(18) | YES |  |

| PackageID | binary(18) | YES | (NULL) |

| Type | tinyint | YES |  |

| SubscriptionType | int | YES |  |

| ClientCount | int | YES | (NULL) |

| BusinessUserCount | int | YES |  |

| AccountantUserCount | int | YES |  |

| CorpCount | int | YES | (NULL) |

| ConsultantCount | int | YES |  |

| PCCount | int | YES |  |

| ExtraPCs | int | YES |  |

| ExtraPCPrice | decimal | YES |  |

| Price | decimal | YES |  |

| Discount | decimal | YES |  |

| DiscountValidity | datetime2 | YES |  |

| PackageStartDate | datetime2 | YES | (NULL) |

| PackageEndDate | datetime2 | YES | (NULL) |

| UserCount | int | YES |  |

| ExtraCorpPrice | decimal | YES |  |

| ExtraUserPrice | decimal | YES |  |

| ExtraConsultantPrice | decimal | YES |  |

| TotalAllowedUsersCount | int | YES |  |

| TotalAllowedCorpCount | int | YES |  |

| TotalAllowedPCCount | int | YES |  |

| TotalAllowedConsultantCount | int | YES |  |

| SubscriptionID | varchar(50) | YES |  |

## dbo.UserSubscriptionPCDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| PCId | binary(18) | YES |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| ActualStartDate | datetime2 | YES |  |

| IsDefaultPC | bit | YES |  |

| Price | decimal | YES |  |

| Status | tinyint | YES |  |

## dbo.UserSubscriptionUserDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UserID | binary(18) | YES |  |

| ChildUserId | binary(18) | YES |  |

| FromDate | datetime2 | YES |  |

| ToDate | datetime2 | YES |  |

| ActualStartDate | datetime2 | YES |  |

| Status | tinyint | YES |  |

## dbo.UseTax

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| TaxName | varchar(250) | NO |  |

| TaxType | smallint | NO |  |

| ParentID | bigint | YES |  |

| ClientID | binary(18) | NO |  |

| Status | smallint | NO |  |

## dbo.UseTaxDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UseTaxID | bigint | YES |  |

| StateID | bigint | YES |  |

| Status | smallint | NO |  |

## dbo.UseTaxRates

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| UseTaxDetailsID | bigint | YES |  |

| Rate1 | decimal | YES |  |

| Rate2 | decimal | YES |  |

| EffectiveFrom | datetime2 | YES |  |

| EffectiveTo | datetime2 | YES |  |

| Status | smallint | NO |  |

| EffectiveFrom2 | datetime2 | YES |  |

| EffectiveTo2 | datetime2 | YES |  |

## dbo.VendorAddress

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| BusinessID | binary(18) | NO |  |

| AdressID | binary(18) | NO |  |

| ContactID | binary(18) | NO |  |

| BusinessTypeID | binary(18) | YES |  |

| Status | smallint | YES |  |

| IsDefault | bit | YES |  |

| AddressType | smallint | YES |  |

## dbo.VendorAIPurposeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| VendorID | binary(18) | NO |  |

| ContractID | binary(18) | YES |  |

| PurposeID | binary(18) | NO |  |

| AIPurposeName | varchar(150) | YES |  |

| Description | varchar(500) | YES |  |

| Type | varchar(150) | YES |  |

| Status | smallint | YES |  |

## dbo.VendorAudit

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| AuditID | bigint | YES |  |

| Name | varchar(250) | YES |  |

| FederalID | varchar(15) | YES |  |

| SSN | varchar(16) | YES |  |

| PrintCheckAs | varchar(50) | YES |  |

| IsAutoBill | bit | YES |  |

| Terms | binary(18) | YES |  |

| PaymentMethodID | binary(18) | YES |  |

| DDBranchNo | nvarchar(10) | YES |  |

| DDInstitutionNo | nvarchar(10) | YES |  |

| UpdatedColumns | varchar(25) | YES |  |

| Status | smallint | YES |  |

| DDAccountNo | varchar(50) | YES |  |

## dbo.VendorContract

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| BusinessID | binary(18) | NO |  |

| AddressID | bigint | YES |  |

| AccountNumber | varchar(20) | YES |  |

| CorpStartDate | datetime | YES |  |

| CorpExpDate | datetime | YES |  |

| Notes | varchar(500) | YES |  |

| AttachemntPath | varchar(300) | YES |  |

| Status | smallint | YES |  |

| IsDefault | bit | YES |  |

## dbo.VendorDirectDepositDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| DDCurrencyLoc | tinyint | YES |  |

| DDBranchNo | nvarchar(10) | YES |  |

| DDInstitutionNo | nvarchar(10) | YES |  |

| DDAccountNo | nvarchar(50) | YES |  |

| CustomEFTRef | nvarchar(50) | YES |  |

| PayerUniqueNo | nvarchar(50) | YES |  |

## dbo.VendorIDsTempTable

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| RequestID | varchar(100) | YES |  |

| VendorID | binary(18) | YES |  |

## dbo.VendorIncomeTimeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| TimeInfoID | binary(18) | NO |  |

| BillingRate | decimal | YES |  |

| Billable | bit | NO |  |

| ProfitCenterID | binary(18) | YES |  |

| ID | binary(18) | NO |  |

## dbo.VendorTaxInfo

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| VendorID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| TaxPercentage | decimal | YES |  |

| LineOrder | int | YES |  |

| Status | smallint | YES |  |

| ContractID | binary(18) | YES |  |

| PurposeID | binary(18) | YES |  |

## dbo.VendorTimeDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| Hrs | decimal | YES |  |

| InfoDate | datetime2 | YES |  |

| ServiceInfoID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| ResourceID | binary(18) | NO |  |

| SourceID | binary(18) | NO |  |

| SourceType | tinyint | NO |  |

| BillingRate | decimal | YES |  |

| PayRate | decimal | YES |  |

| ID | binary(18) | NO |  |

| Billable | bit | NO |  |

| ProfitCenterID | binary(18) | YES |  |

## dbo.VendorTransactionList

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| TransNumber | int | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | varchar(10) | YES |  |

| Number | varchar(100) | YES |  |

| Amount | decimal | YES |  |

| AccountName | varchar(127) | YES |  |

| CLR | varchar(1) | NO |  |

| CorporationName | varchar(100) | NO |  |

| StoreName | varchar(50) | YES |  |

| StoreID | binary(18) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Memo | varchar(500) | YES |  |

| DueDate | date | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| Balance | decimal | NO |  |

| DebitCredit | bit | NO |  |

| TransID | binary(18) | NO |  |

| CorporationID | binary(18) | NO |  |

| FranchiseeName | varchar(50) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| TSourceID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AccountStatus | tinyint | NO |  |

| AccountTypeID | binary(18) | NO |  |

| BankType | varchar(1) | NO |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TSourceType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| TransStatus | smallint | NO |  |

| JournalStatus | int | YES |  |

| TransactionDate | datetime2 | NO |  |

| Order | smallint | YES |  |

| JESourceID | binary(18) | YES |  |

| Name | varchar(100) | NO |  |

| Debit | decimal | NO |  |

| Credit | decimal | NO |  |

| CreditDays | int | YES |  |

| PaymentMethod | varchar(50) | NO |  |

| CreatedOn | datetime2 | YES |  |

| ModifiedOn | datetime2 | YES |  |

| VoidDate | datetime2 | YES |  |

## dbo.VendorTransactionsList1099

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | YES |  |

| TransNumber | int | YES |  |

| EntryDate | datetime2 | NO |  |

| BillDate | datetime2 | YES |  |

| ParentCustID | binary(18) | YES |  |

| ParentCustName | varchar(100) | YES |  |

| Number | varchar(100) | YES |  |

| Amount | decimal | YES |  |

| AccountName | varchar(127) | YES |  |

| CLR | varchar(1) | NO |  |

| CorporationName | varchar(100) | NO |  |

| StoreName | varchar(50) | YES |  |

| StoreID | binary(18) | YES |  |

| CostcenterName | varchar(50) | YES |  |

| CostcenterID | binary(18) | YES |  |

| Memo | varchar(500) | YES |  |

| DueDate | date | YES |  |

| CreatedBy | varchar(101) | YES |  |

| ModifiedBy | varchar(101) | YES |  |

| Balance | decimal | YES |  |

| DebitCredit | bit | YES |  |

| TransID | binary(18) | YES |  |

| CorporationID | binary(18) | NO |  |

| FranchiseeName | varchar(50) | YES |  |

| FranchiseeID | binary(18) | YES |  |

| TSourceID | binary(18) | YES |  |

| AccountID | binary(18) | YES |  |

| AccountStatus | tinyint | YES |  |

| AccountTypeID | binary(18) | YES |  |

| BankType | varchar(1) | NO |  |

| ReconciliationID | binary(18) | YES |  |

| ReconStatus | tinyint | YES |  |

| ParentID | binary(18) | YES |  |

| TSourceType | smallint | YES |  |

| SourceType | smallint | YES |  |

| ParentSourceType | smallint | YES |  |

| TransStatus | smallint | YES |  |

| JournalStatus | int | YES |  |

| TransactionDate | datetime2 | YES |  |

| Order | smallint | YES |  |

| JESourceID | binary(18) | YES |  |

| Name | varchar(100) | NO |  |

| Debit | decimal | YES |  |

| Credit | decimal | YES |  |

| CreditDays | int | YES |  |

| FederalID | varchar(15) | YES |  |

| SSN | varchar(16) | YES |  |

| Is1099 | bit | YES |  |

| VendorAddress | varchar(250) | YES |  |

| VendorState | varchar(75) | YES |  |

| VendorCountry | varchar(50) | YES |  |

| ZipCode | varchar(15) | YES |  |

| City | varchar(50) | YES |  |

| PaymentMethod | varchar(50) | NO |  |

| VoidDate | datetime2 | YES |  |

## dbo.WageCost

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | binary(18) | NO |  |

| CheckDate | date | NO |  |

## dbo.WebhookSubcriptionEventDetails

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | int | NO |  |

| WebhookID | varchar(150) | NO |  |

| ResourceEvent | varchar(50) | NO |  |

| Description | varchar(50) | YES |  |

| Url | varchar(500) | NO |  |

| DateCreated | varchar(50) | NO |  |

| DateModified | varchar(50) | YES |  |

| Account | varchar(50) | YES |  |

| SecurityKey1 | varchar(100) | NO |  |

## dbo.Widgets

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| Name | varchar(100) | YES |  |

| RowX | int | YES |  |

| ColX | int | YES |  |

| SizeX | int | YES |  |

| SizeY | int | YES |  |

| Status | smallint | YES |  |

| PackageType | tinyint | YES |  |

| WidgetID | bigint | YES |  |

## dbo.YEPJobSchedule

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| JobId | int | NO |  |

| JobType | smallint | NO |  |

| JournalEntryID | varbinary(18) | YES |  |

| CorporationID | varbinary(18) | NO |  |

| Years | varchar(150) | YES |  |

| Status | smallint | NO |  |

| RunDate | datetime | YES |  |

| CreatedDate | datetime | NO |  |

## dbo.YodleeBankTransactionsDummy

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| ID | bigint | NO |  |

| ReqID | varchar(100) | YES |  |

| BankAccountID | varchar(50) | YES |  |

| isdbExists | varchar(3) | YES |  |

| ExistingId | bigint | YES |  |

| ActualTransactionType | varchar(50) | YES |  |

| Amount | decimal | YES |  |

| Status | smallint | YES |  |

| isalreadPosted | varchar(10) | YES |  |

| AccountID | binary(18) | YES |  |

| BankLoginId | bigint | YES |  |

| CheckNo | varchar(50) | YES |  |

| Date | datetime2 | YES |  |

| TransactionType | varchar(10) | YES |  |

| Description | varchar(500) | YES |  |

| EndDate | datetime2 | YES |  |

| SyncDate | datetime2 | YES |  |

| TransactionId | varchar(50) | YES |  |

| TransactionStatusType | smallint | YES |  |

| RunningBalance | decimal | YES |  |
