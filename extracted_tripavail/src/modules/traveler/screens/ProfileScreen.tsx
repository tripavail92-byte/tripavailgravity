import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Mail, MapPin, Phone, Shield, Camera, Check, X, Key, Lock
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import { AnimatedCameraIcon, AnimatedEditIcon } from '../../../components/icons/profile/AnimatedProfileIcons';
import { ModernVerificationBadge } from '../../../components/profile/ModernVerificationBadge';
import { CountryPhoneInput } from '../../../components/profile/CountryPhoneInput';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@gmail.com',
    phone: '+92 300 1234567',
    location: 'Lahore, Pakistan',
    bio: 'Travel enthusiast exploring the world one destination at a time ✈️',
    verified: true,
    joinDate: 'Member since Jan 2024'
  });

  const [editData, setEditData] = useState(profileData);

  const handleSaveChanges = () => {
    setProfileData(editData);
    setIsEditing(false);
  };

  const handleCancelChanges = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    // TODO: Implement password change logic
    console.log('Password change requested');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowChangePassword(false);
    alert('Password changed successfully!');
  };

  const contactMethods = [
    { 
      id: 'email',
      icon: Mail, 
      label: 'Email', 
      value: profileData.email, 
      verified: true,
      color: 'rgb(var(--primary) / 0.7)'
    },
    { 
      id: 'phone',
      icon: Phone, 
      label: 'Phone', 
      value: profileData.phone, 
      verified: false,
      color: 'rgb(var(--muted-foreground) / 0.7)'
    },
    { 
      id: 'location',
      icon: MapPin, 
      label: 'Location', 
      value: profileData.location, 
      verified: false,
      color: 'rgb(var(--accent-foreground) / 0.7)'
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">My Profile</h2>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="p-8 border-0 shadow-lg bg-card relative overflow-hidden border-border/20 dark:shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary rounded-full translate-y-12 -translate-x-12" />
          </div>

          <div className="relative z-10">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                className="relative group cursor-pointer mb-6"
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative">
                  <ProfileAvatar size="xl" name={profileData.name} />
                  
                  {/* Edit Photo Button */}
                  <motion.button
                    onClick={() => setIsChangingPhoto(true)}
                    className="absolute -bottom-1 -right-1 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <AnimatedCameraIcon className="w-5 h-5" color="white" />
                  </motion.button>

                  {/* Change Photo Options */}
                  {isChangingPhoto && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-popover rounded-lg shadow-xl p-4 min-w-[200px] border border-border z-50"
                    >
                      <div className="space-y-2">
                        <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-popover-foreground">
                          Take Photo
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-popover-foreground">
                          Choose from Gallery
                        </button>
                        <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-popover-foreground">
                          Remove Photo
                        </button>
                        <hr className="my-2 border-border" />
                        <button 
                          onClick={() => setIsChangingPhoto(false)}
                          className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Name and verification */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold text-card-foreground">{profileData.name}</h3>
                  <ModernVerificationBadge verified={profileData.verified} size="md" />
                </div>
                <p className="text-muted-foreground mb-2 max-w-sm">{profileData.bio}</p>
                <p className="text-sm text-muted-foreground">{profileData.joinDate}</p>
              </motion.div>
            </div>

            {/* Edit Toggle */}
            <div className="flex justify-center mb-6">
              {!isEditing ? (
                <motion.button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatedEditIcon className="w-4 h-4" color="white" />
                  Edit Profile
                </motion.button>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleSaveChanges}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </motion.button>
                  <motion.button
                    onClick={handleCancelChanges}
                    className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-full hover:opacity-90 transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              )}
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              {!isEditing ? (
                // View Mode
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {/* Bio */}
                  <div className="bg-accent/30 rounded-xl p-4 border border-border/20">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">About Me</label>
                    <p className="text-card-foreground">{profileData.bio}</p>
                  </div>

                  {/* Contact Methods */}
                  {contactMethods.map((method, index) => (
                    <motion.div
                      key={method.id}
                      className="flex items-center justify-between p-4 bg-accent/30 rounded-xl border border-border/20"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                          <method.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">{method.label}</div>
                          <div className="font-medium text-card-foreground">{method.value}</div>
                        </div>
                      </div>
                      <ModernVerificationBadge verified={method.verified} size="sm" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                // Edit Mode
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Full Name</label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="bg-input border-border focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">About Me</label>
                    <Textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="bg-input border-border focus:border-primary focus:ring-primary/20 h-20"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Email</label>
                    <Input
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="bg-input border-border focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Phone</label>
                    <CountryPhoneInput
                      value={editData.phone}
                      onChange={(value) => setEditData({ ...editData, phone: value })}
                      className="bg-input border-border focus:border-primary focus:ring-primary/20"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
                    <Input
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      className="bg-input border-border focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </motion.div>
              )}

              {/* Security Section */}
              <div className="mt-8 pt-6 border-t border-border/20">
                <h4 className="text-lg font-semibold text-card-foreground mb-4">Account Security</h4>
                <motion.button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full flex items-center justify-between p-4 bg-accent/30 rounded-xl border border-border/20 hover:bg-accent/50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-card-foreground">Change Password</div>
                      <div className="text-sm text-muted-foreground">Update your account password</div>
                    </div>
                  </div>
                  <div className="text-primary font-medium">
                    {showChangePassword ? 'Cancel' : 'Change'}
                  </div>
                </motion.button>

                {/* Change Password Form */}
                {showChangePassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-accent/20 rounded-xl border border-border/20"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Current Password</label>
                        <Input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="bg-input border-border focus:border-primary focus:ring-primary/20"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">New Password</label>
                        <Input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="bg-input border-border focus:border-primary focus:ring-primary/20"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Confirm New Password</label>
                        <Input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="bg-input border-border focus:border-primary focus:ring-primary/20"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={handleChangePassword}
                          className="flex items-center gap-2"
                          disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                          <Lock className="w-4 h-4" />
                          Update Password
                        </Button>
                        <Button
                          onClick={() => {
                            setShowChangePassword(false);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

          </div>
        </Card>
      </motion.div>

      {/* Click outside to close photo options */}
      {isChangingPhoto && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          onClick={() => setIsChangingPhoto(false)}
        />
      )}
    </div>
  );
}