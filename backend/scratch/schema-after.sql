CREATE TABLE [AspNetRoles] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(256) NULL,
    [NormalizedName] nvarchar(256) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AspNetUsers] (
    [Id] nvarchar(450) NOT NULL,
    [FullName] nvarchar(max) NOT NULL,
    [ExcludeFromMarketing] bit NOT NULL,
    [MeasurementSystem] nvarchar(max) NOT NULL,
    [Currency] nvarchar(max) NOT NULL,
    [TimeZoneId] nvarchar(max) NOT NULL,
    [TemperatureUnit] nvarchar(max) NOT NULL,
    [CompanyDescription] nvarchar(max) NULL,
    [ProjectStartMode] nvarchar(max) NULL,
    [OnboardingCompletedAt] datetime2 NULL,
    [UserName] nvarchar(256) NULL,
    [NormalizedUserName] nvarchar(256) NULL,
    [Email] nvarchar(256) NULL,
    [NormalizedEmail] nvarchar(256) NULL,
    [EmailConfirmed] bit NOT NULL,
    [PasswordHash] nvarchar(max) NULL,
    [SecurityStamp] nvarchar(max) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [PhoneNumberConfirmed] bit NOT NULL,
    [TwoFactorEnabled] bit NOT NULL,
    [LockoutEnd] datetimeoffset NULL,
    [LockoutEnabled] bit NOT NULL,
    [AccessFailedCount] int NOT NULL,
    CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Currencies] (
    [Id] int NOT NULL IDENTITY,
    [Code] nvarchar(3) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Symbol] nvarchar(8) NOT NULL,
    [SortOrder] int NOT NULL,
    CONSTRAINT [PK_Currencies] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [LookupOptions] (
    [Id] int NOT NULL IDENTITY,
    [Category] nvarchar(40) NOT NULL,
    [Value] nvarchar(100) NOT NULL,
    [Label] nvarchar(200) NOT NULL,
    [Hint] nvarchar(400) NULL,
    [SortOrder] int NOT NULL,
    CONSTRAINT [PK_LookupOptions] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AspNetRoleClaims] (
    [Id] int NOT NULL IDENTITY,
    [RoleId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserClaims] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserLogins] (
    [LoginProvider] nvarchar(450) NOT NULL,
    [ProviderKey] nvarchar(450) NOT NULL,
    [ProviderDisplayName] nvarchar(max) NULL,
    [UserId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserRoles] (
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserTokens] (
    [UserId] nvarchar(450) NOT NULL,
    [LoginProvider] nvarchar(450) NOT NULL,
    [Name] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Projects] (
    [Id] uniqueidentifier NOT NULL,
    [OwnerId] nvarchar(450) NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(2000) NULL,
    [Type] nvarchar(40) NOT NULL,
    [Status] nvarchar(40) NOT NULL,
    [BudgetTotal] decimal(18,2) NOT NULL DEFAULT 0.0,
    [TotalSpent] decimal(18,2) NOT NULL DEFAULT 0.0,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Projects] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Projects_AspNetUsers_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [ProjectTasks] (
    [Id] uniqueidentifier NOT NULL,
    [ProjectId] uniqueidentifier NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [AssigneeName] nvarchar(200) NOT NULL,
    [AssignedDate] date NOT NULL,
    [Deadline] date NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ProjectTasks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProjectTasks_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [ActivityLogEntries] (
    [Id] uniqueidentifier NOT NULL,
    [ProjectId] uniqueidentifier NOT NULL,
    [ProjectTaskId] uniqueidentifier NULL,
    [Description] nvarchar(500) NOT NULL,
    [OccurredAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ActivityLogEntries] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ActivityLogEntries_ProjectTasks_ProjectTaskId] FOREIGN KEY ([ProjectTaskId]) REFERENCES [ProjectTasks] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ActivityLogEntries_Projects_ProjectId] FOREIGN KEY ([ProjectId]) REFERENCES [Projects] ([Id]) ON DELETE CASCADE
);
GO


IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Code', N'Name', N'SortOrder', N'Symbol') AND [object_id] = OBJECT_ID(N'[Currencies]'))
    SET IDENTITY_INSERT [Currencies] ON;
INSERT INTO [Currencies] ([Id], [Code], [Name], [SortOrder], [Symbol])
VALUES (1, N'USD', N'US Dollar', 1, N'$'),
(2, N'EUR', N'Euro', 2, N'€'),
(3, N'GBP', N'British Pound', 3, N'£'),
(4, N'CAD', N'Canadian Dollar', 4, N'CA$'),
(5, N'AUD', N'Australian Dollar', 5, N'A$'),
(6, N'NZD', N'New Zealand Dollar', 6, N'NZ$'),
(7, N'JPY', N'Japanese Yen', 7, N'¥'),
(8, N'CNY', N'Chinese Yuan', 8, N'CN¥'),
(9, N'INR', N'Indian Rupee', 9, N'₹'),
(10, N'SGD', N'Singapore Dollar', 10, N'S$'),
(11, N'HKD', N'Hong Kong Dollar', 11, N'HK$'),
(12, N'CHF', N'Swiss Franc', 12, N'CHF'),
(13, N'SEK', N'Swedish Krona', 13, N'kr'),
(14, N'NOK', N'Norwegian Krone', 14, N'kr'),
(15, N'DKK', N'Danish Krone', 15, N'kr'),
(16, N'PLN', N'Polish Złoty', 16, N'zł'),
(17, N'ZAR', N'South African Rand', 17, N'R'),
(18, N'AED', N'UAE Dirham', 18, N'د.إ'),
(19, N'SAR', N'Saudi Riyal', 19, N'﷼'),
(20, N'BRL', N'Brazilian Real', 20, N'R$'),
(21, N'MXN', N'Mexican Peso', 21, N'MX$'),
(22, N'PHP', N'Philippine Peso', 22, N'₱'),
(23, N'IDR', N'Indonesian Rupiah', 23, N'Rp'),
(24, N'MYR', N'Malaysian Ringgit', 24, N'RM'),
(25, N'NGN', N'Nigerian Naira', 25, N'₦'),
(26, N'KES', N'Kenyan Shilling', 26, N'KSh');
IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Code', N'Name', N'SortOrder', N'Symbol') AND [object_id] = OBJECT_ID(N'[Currencies]'))
    SET IDENTITY_INSERT [Currencies] OFF;
GO


IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Category', N'Hint', N'Label', N'SortOrder', N'Value') AND [object_id] = OBJECT_ID(N'[LookupOptions]'))
    SET IDENTITY_INSERT [LookupOptions] ON;
INSERT INTO [LookupOptions] ([Id], [Category], [Hint], [Label], [SortOrder], [Value])
VALUES (100, N'MeasurementSystem', NULL, N'Metric System: kg, m, m² etc.', 1, N'Metric'),
(101, N'MeasurementSystem', NULL, N'Imperial System: lb, ft, ft² etc.', 2, N'Imperial'),
(110, N'TemperatureUnit', NULL, N'Celsius', 1, N'Celsius'),
(111, N'TemperatureUnit', NULL, N'Fahrenheit', 2, N'Fahrenheit'),
(120, N'CompanyDescription', N'Builder', N'Building homes', 1, N'Builder'),
(121, N'CompanyDescription', N'Remodeler / renovations', N'Remodeling', 2, N'Remodeler'),
(122, N'CompanyDescription', N'Construction manager', N'Coordinate and supervise', 3, N'ConstructionManager'),
(123, N'CompanyDescription', NULL, N'Others', 4, N'Other'),
(130, N'CountryCode', NULL, N'+1', 1, N'+1'),
(131, N'CountryCode', NULL, N'+44', 2, N'+44'),
(132, N'CountryCode', NULL, N'+61', 3, N'+61'),
(133, N'CountryCode', NULL, N'+63', 4, N'+63'),
(134, N'CountryCode', NULL, N'+65', 5, N'+65'),
(135, N'CountryCode', NULL, N'+81', 6, N'+81'),
(136, N'CountryCode', NULL, N'+91', 7, N'+91'),
(150, N'StartMode', N'Start from scratch and build your project by filling in your own data', N'Create a project from scratch', 1, N'Scratch'),
(151, N'StartMode', N'Select a project template from our list of templates', N'Choose from project template', 2, N'Template'),
(160, N'ProjectType', NULL, N'New Home', 1, N'NewHome'),
(161, N'ProjectType', NULL, N'Minor renovation', 2, N'MinorRenovation'),
(162, N'ProjectType', NULL, N'Major renovation', 3, N'MajorRenovation'),
(163, N'ProjectType', NULL, N'Refurb', 4, N'Refurb'),
(164, N'ProjectType', NULL, N'Remodeling', 5, N'Remodeling'),
(165, N'ProjectType', NULL, N'Commercial', 6, N'Commercial'),
(166, N'ProjectType', NULL, N'Maintenance', 7, N'Maintenance'),
(167, N'ProjectType', NULL, N'Others', 8, N'Other'),
(180, N'ProjectStatus', NULL, N'New', 1, N'New'),
(181, N'ProjectStatus', NULL, N'In Progress', 2, N'InProgress'),
(182, N'ProjectStatus', NULL, N'Lost', 3, N'Lost'),
(183, N'ProjectStatus', NULL, N'Completed', 4, N'Completed'),
(184, N'ProjectStatus', NULL, N'Archived', 5, N'Archived'),
(185, N'ProjectStatus', NULL, N'Others', 6, N'Other');
IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Category', N'Hint', N'Label', N'SortOrder', N'Value') AND [object_id] = OBJECT_ID(N'[LookupOptions]'))
    SET IDENTITY_INSERT [LookupOptions] OFF;
GO


CREATE INDEX [IX_ActivityLogEntries_OccurredAt] ON [ActivityLogEntries] ([OccurredAt]);
GO


CREATE INDEX [IX_ActivityLogEntries_ProjectId] ON [ActivityLogEntries] ([ProjectId]);
GO


CREATE INDEX [IX_ActivityLogEntries_ProjectTaskId] ON [ActivityLogEntries] ([ProjectTaskId]);
GO


CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
GO


CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;
GO


CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
GO


CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
GO


CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
GO


CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
GO


CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;
GO


CREATE UNIQUE INDEX [IX_Currencies_Code] ON [Currencies] ([Code]);
GO


CREATE UNIQUE INDEX [IX_LookupOptions_Category_Value] ON [LookupOptions] ([Category], [Value]);
GO


CREATE INDEX [IX_Projects_OwnerId] ON [Projects] ([OwnerId]);
GO


CREATE INDEX [IX_ProjectTasks_ProjectId] ON [ProjectTasks] ([ProjectId]);
GO


