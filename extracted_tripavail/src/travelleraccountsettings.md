# Traveler Account Settings Screen Documentation

## 🎯 Screen Purpose & Overview

The **Traveler Account Settings Screen** (`AccountSettingsScreen.tsx`) serves as the comprehensive control center for account management, security configuration, and privacy preferences. This screen prioritizes user control and security while maintaining an intuitive interface for managing complex account settings.

### **Core Functionality**
- **Security & Privacy Management** - Account protection and data controls
- **Account Information Updates** - Personal details and verification management
- **Notification Preferences** - Communication settings and alerts
- **Privacy Controls** - Data sharing and visibility preferences
- **App Customization** - Theme, language, and feature preferences

---

## 🎨 Visual Design & Layout

### **Design Philosophy**
- **Security-first approach** with warning indicators for incomplete settings
- **Category-based organization** grouping related settings logically
- **Status-aware design** showing current setting states with badges
- **Trust-building elements** emphasizing account protection
- **Modern card layout** with consistent styling and animations

### **Color Scheme**
```typescript
// Status & Warning Colors
warningRose: "#E11D48",         // Rose 600 for warnings
primaryBlue: "#3B82F6",         // Blue for privacy/profile settings
activeGreen: "#10B981",         // Green for active features
grayMuted: "#6B7280",           // Gray for inactive/muted states

// Category Color Coding
securityRed: "#EF4444",         // Red for security warnings
notificationsBlue: "#3B82F6",   // Blue for notifications
privacyPurple: "#8B5CF6",       // Purple for privacy controls
```

### **Layout Structure**
```typescript
<AccountSettingsScreen>
  <Header>
    <BackButton />
    <HeaderInfo>
      <Title>Account Settings</Title>
      <Subtitle>Manage your account security and preferences</Subtitle>
    </HeaderInfo>
  </Header>
  
  <SettingsCategories>
    {settingsCategories.map(category => (
      <SettingsCategoryCard key={category.id}>
        <CategoryIcon />
        <CategoryContent>
          <TitleRow>
            <CategoryTitle />
            <StatusIndicators>
              <WarningIcon show={category.hasWarning} />
              <StatusBadge content={category.badge} />
            </StatusIndicators>
          </TitleRow>
          <CategoryDescription />
        </CategoryContent>
        <NavigationChevron />
      </SettingsCategoryCard>
    ))}
  </SettingsCategories>
  
  <SupportSection>
    <SupportCard>
      <SupportIcon />
      <SupportContent>
        <Title>Need Help?</Title>
        <Description />
        <ContactSupportButton />
      </SupportContent>
    </SupportCard>
  </SupportSection>
</AccountSettingsScreen>
```

---

## 🧩 Core Components & Features

### **1. Security & Privacy Settings**
```typescript
<SecurityPrivacyCard hasWarning={true}>
  <CategoryHeader>
    <SecurityIcon size={20} />
    <Title>Security & Privacy</Title>
    <WarningIndicator>
      <WarningIcon size={16} className="text-primary" />
    </WarningIndicator>
  </CategoryHeader>
  
  <Description>
    Manage your account security, authentication, and privacy settings
  </Description>
  
  <NavigateButton onClick={() => onNavigate('security-settings')} />
</SecurityPrivacyCard>
```

**Security Features:**
- **Warning indicators** for incomplete 2FA setup
- **Security status overview** showing current protection level
- **One-click navigation** to detailed security settings
- **Priority placement** at top of settings list

### **2. Account Information Management**
```typescript
<AccountInfoCard hasWarning={true}>
  <CategoryHeader>
    <AccountInfoIcon size={20} />
    <Title>Account Information</Title>
    <WarningIndicator>
      <WarningIcon size={16} className="text-primary" />
    </WarningIndicator>
  </CategoryHeader>
  
  <Description>
    Update your personal details, contact info, and verification status
  </Description>
  
  <NavigateButton onClick={() => onNavigate('account-info')} />
</AccountInfoCard>
```

**Account Info Features:**
- **Verification status tracking** with warning for unverified accounts
- **Personal data management** access
- **Contact information updates** functionality
- **Warning indicators** for incomplete profiles

### **3. Notifications Management**
```typescript
<NotificationsCard>
  <CategoryHeader>
    <NotificationsIcon size={20} />
    <Title>Notifications</Title>
    <StatusBadge className="bg-primary/10 text-primary">
      4 Active
    </StatusBadge>
  </CategoryHeader>
  
  <Description>
    Control what notifications you receive and how you get them
  </Description>
  
  <NavigateButton onClick={() => onNavigate('notifications-settings')} />
</NotificationsCard>
```

**Notification Features:**
- **Active notification count** showing current enabled notifications
- **Granular control** over notification types
- **Delivery method preferences** (email, SMS, push)
- **Status badge** indicating current notification state

### **4. Privacy Controls**
```typescript
<PrivacyControlsCard>
  <CategoryHeader>
    <PrivacyIcon size={20} />
    <Title>Privacy Controls</Title>
    <StatusBadge className="bg-blue-100 text-blue-700">
      Profile Public
    </StatusBadge>
  </CategoryHeader>
  
  <Description>
    Manage data sharing, visibility, and location tracking preferences
  </Description>
  
  <NavigateButton onClick={() => onNavigate('privacy-settings')} />
</PrivacyControlsCard>
```

**Privacy Features:**
- **Profile visibility status** (Public/Private indicators)
- **Data sharing preferences** management
- **Location tracking controls** for travel features
- **Third-party app permissions** management

### **5. App Preferences**
```typescript
<AppPreferencesCard>
  <CategoryHeader>
    <AppPreferencesIcon size={20} />
    <Title>App Preferences</Title>
    <StatusBadge className="bg-gray-100 text-gray-700">
      Light Mode
    </StatusBadge>
  </CategoryHeader>
  
  <Description>
    Customize your app experience, theme, and feature settings
  </Description>
  
  <NavigateButton onClick={() => onNavigate('app-preferences')} />
</AppPreferencesCard>
```

**App Preferences Features:**
- **Theme selection** (Light/Dark mode indicator)
- **Language preferences** for international users
- **Feature toggles** for optional app functionality
- **Accessibility settings** for enhanced usability

---

## 📱 User Interactions & Navigation

### **Interactive Elements**
```typescript
// Category Card Interactions
<CategoryCard
  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  whileHover={{ x: 4 }}                    // Subtle slide animation
  whileTap={{ scale: 0.98 }}               // Touch feedback
  onClick={() => onNavigate(category.screen)}
>

// Warning State Handling
{category.hasWarning && (
  <WarningIndicator className="text-primary">
    <WarningIcon size={16} />
  </WarningIndicator>
)}

// Status Badge Display
{category.badge && (
  <StatusBadge className={category.badgeColor}>
    {category.badge}
  </StatusBadge>
)}
```

### **Motion Animations**
```typescript
// Staggered Category Entry
<CategoryCard
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>

// Support Section Animation
<SupportSection
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}
>
```

---

## 🔧 Technical Implementation

### **Settings Categories Data Structure**
```typescript
interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  hasWarning: boolean;
  badge: string | null;
  badgeColor: string;
  screen: string;
}

const settingsCategories: SettingsCategory[] = [
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Manage your account security, authentication, and privacy settings',
    icon: SecurityIcon,
    hasWarning: true,              // 2FA not enabled
    badge: null,
    badgeColor: '',
    screen: 'security-settings'
  },
  {
    id: 'account',
    title: 'Account Information',
    description: 'Update your personal details, contact info, and verification status',
    icon: AccountInfoIcon,
    hasWarning: true,              // Profile incomplete
    badge: null,
    badgeColor: '',
    screen: 'account-info'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Control what notifications you receive and how you get them',
    icon: NotificationsIcon,
    hasWarning: false,
    badge: '4 Active',             // Active notification count
    badgeColor: 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary',
    screen: 'notifications-settings'
  },
  {
    id: 'privacy',
    title: 'Privacy Controls',
    description: 'Manage data sharing, visibility, and location tracking preferences',
    icon: PrivacyIcon,
    hasWarning: false,
    badge: 'Profile Public',       // Privacy status
    badgeColor: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    screen: 'privacy-settings'
  },
  {
    id: 'preferences',
    title: 'App Preferences',
    description: 'Customize your app experience, theme, and feature settings',
    icon: AppPreferencesIcon,
    hasWarning: false,
    badge: 'Light Mode',           // Current theme
    badgeColor: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    screen: 'app-preferences'
  }
];
```

### **Component Props & State**
```typescript
interface AccountSettingsScreenProps {
  onNavigate: (screen: string) => void;
}

// Navigation routes for settings categories
const navigationRoutes = {
  'security-settings': 'SecuritySettingsScreen',
  'account-info': 'AccountInfoScreen',
  'notifications-settings': 'NotificationsSettingsScreen',
  'privacy-settings': 'PrivacySettingsScreen',
  'app-preferences': 'AppPreferencesScreen',
  'help': 'HelpScreen'
};
```

### **Icon System**
```typescript
import { 
  SecurityIcon,           // Shield icon for security settings
  AccountInfoIcon,        // User icon for account information
  NotificationsIcon,      // Bell icon for notifications
  PrivacyIcon,           // Eye icon for privacy controls
  AppPreferencesIcon,    // Settings icon for app preferences
  SupportIcon,           // Help circle icon for support
  WarningIcon            // Alert triangle for warnings
} from '../../../components/icons/profile/AccountSettingsIcons';
```

---

## 🎯 User Experience Features

### **Warning System**
```typescript
const warningStates = {
  security: {
    condition: !user.twoFactorEnabled,
    message: 'Two-factor authentication not enabled',
    severity: 'high'
  },
  account: {
    condition: user.profileCompletion < 80,
    message: 'Profile information incomplete',
    severity: 'medium'
  },
  verification: {
    condition: !user.emailVerified || !user.phoneVerified,
    message: 'Account verification pending',
    severity: 'high'
  }
};
```

### **Status Indicators**
- **Badge system** showing current states (4 Active, Profile Public, Light Mode)
- **Warning icons** for security concerns
- **Color coding** for different status types
- **Real-time updates** reflecting current settings

### **Support Integration**
```typescript
<SupportSection>
  <SupportCard className="bg-gray-50 dark:bg-gray-800/50">
    <SupportIcon size={24} />
    <SupportContent>
      <Title>Need Help?</Title>
      <Description>
        Our support team is here to help you with any account or settings questions.
      </Description>
      <ContactSupportButton onClick={() => onNavigate('help')}>
        Contact Support
      </ContactSupportButton>
    </SupportContent>
  </SupportCard>
</SupportSection>
```

---

## 🔐 Security & Privacy Considerations

### **Security Priority Areas**
1. **Two-Factor Authentication** - Enable/disable 2FA
2. **Password Management** - Change password, strength requirements
3. **Login History** - Recent login activity and device management
4. **App Permissions** - Third-party app access controls
5. **Data Export** - Account data download capabilities

### **Privacy Controls**
1. **Profile Visibility** - Public/private profile settings
2. **Data Sharing** - Third-party data sharing preferences
3. **Location Tracking** - GPS and location service controls
4. **Marketing Communications** - Email and SMS preferences
5. **Data Retention** - Account deletion and data purging

### **Compliance Features**
- **GDPR compliance** - European data protection requirements
- **Privacy policy links** - Easy access to privacy documentation
- **Data subject rights** - Access, portability, and deletion rights
- **Consent management** - Granular permission controls

---

## 🔮 Future Enhancements

### **Advanced Security Features**
1. **Biometric Authentication** - Fingerprint and face recognition
2. **Security Keys** - Hardware token support
3. **Risk Assessment** - Account security scoring
4. **Breach Monitoring** - Dark web monitoring for account data
5. **Session Management** - Active session monitoring and termination

### **Enhanced Privacy Controls**
1. **Data Minimization** - Automatic data cleanup
2. **Anonymous Mode** - Browse and book without tracking
3. **VPN Integration** - Built-in privacy protection
4. **Cookie Management** - Granular tracking controls
5. **Data Portability** - Easy export to other platforms

### **Smart Preferences**
1. **AI-powered Suggestions** - Intelligent setting recommendations
2. **Context-aware Settings** - Location-based preference adjustments
3. **Usage Analytics** - Personal app usage insights
4. **Automation Rules** - Conditional setting changes
5. **Backup & Sync** - Settings synchronization across devices

This comprehensive account settings system provides travelers with complete control over their account security, privacy, and preferences while maintaining an intuitive and secure user experience! 🔐⚙️