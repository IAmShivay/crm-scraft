'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Shield 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logger } from "@/lib/logger";

// Profile Settings Interface
interface ProfileSettings {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  professionalInfo: {
    title: string;
    department: string;
    bio: string;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark';
    emailUpdates: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    activityLogging: boolean;
  };
}

export default function ProfileSettingsPage() {
  // Mock profile settings - replace with actual data
  const [profile, setProfile] = useState<ProfileSettings>({
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      avatar: '/path/to/avatar.jpg'
    },
    professionalInfo: {
      title: 'Senior Product Manager',
      department: 'Product Development',
      bio: 'Passionate about creating innovative solutions that solve real-world problems.'
    },
    preferences: {
      language: 'en',
      theme: 'light',
      emailUpdates: true
    },
    security: {
      twoFactorAuth: true,
      activityLogging: false
    }
  });

  const handleSaveProfile = () => {
    // Implement save logic
    logger.debug('Saving profile settings', profile);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({
          ...profile,
          personalInfo: {
            ...profile.personalInfo,
            avatar: reader.result as string
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2" /> Personal Information
            </CardTitle>
            <CardDescription>
              Manage your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={profile.personalInfo.avatar} 
                  alt="Profile Avatar" 
                />
                <AvatarFallback>
                  {profile.personalInfo.firstName[0]}
                  {profile.personalInfo.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Input 
                type="file" 
                accept="image/*"
                onChange={handleAvatarUpload}
                className="max-w-xs"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input 
                  value={profile.personalInfo.firstName}
                  onChange={(e) => setProfile({
                    ...profile,
                    personalInfo: {
                      ...profile.personalInfo,
                      firstName: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input 
                  value={profile.personalInfo.lastName}
                  onChange={(e) => setProfile({
                    ...profile,
                    personalInfo: {
                      ...profile.personalInfo,
                      lastName: e.target.value
                    }
                  })}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={profile.personalInfo.email}
                onChange={(e) => setProfile({
                  ...profile,
                  personalInfo: {
                    ...profile.personalInfo,
                    email: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                type="tel"
                value={profile.personalInfo.phone}
                onChange={(e) => setProfile({
                  ...profile,
                  personalInfo: {
                    ...profile.personalInfo,
                    phone: e.target.value
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2" /> Professional Details
            </CardTitle>
            <CardDescription>
              Update your professional information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Job Title</Label>
              <Input 
                value={profile.professionalInfo.title}
                onChange={(e) => setProfile({
                  ...profile,
                  professionalInfo: {
                    ...profile.professionalInfo,
                    title: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Select 
                value={profile.professionalInfo.department}
                onValueChange={(value) => setProfile({
                  ...profile,
                  professionalInfo: {
                    ...profile.professionalInfo,
                    department: value
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product Development">Product Development</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Customer Support">Customer Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Professional Bio</Label>
              <Textarea 
                value={profile.professionalInfo.bio}
                onChange={(e) => setProfile({
                  ...profile,
                  professionalInfo: {
                    ...profile.professionalInfo,
                    bio: e.target.value
                  }
                })}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2" /> Preferences
            </CardTitle>
            <CardDescription>
              Customize your application experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Language</Label>
              <Select 
                value={profile.preferences.language}
                onValueChange={(value) => setProfile({
                  ...profile,
                  preferences: {
                    ...profile.preferences,
                    language: value
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Theme</Label>
              <Select 
                value={profile.preferences.theme}
                onValueChange={(value) => setProfile({
                  ...profile,
                  preferences: {
                    ...profile.preferences,
                    theme: value as 'light' | 'dark'
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2" /> Security
            </CardTitle>
            <CardDescription>
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Two-Factor Authentication</Label>
              <Switch 
                checked={profile.security.twoFactorAuth}
                onCheckedChange={(checked) => setProfile({
                  ...profile,
                  security: {
                    ...profile.security,
                    twoFactorAuth: checked
                  }
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Activity Logging</Label>
              <Switch 
                checked={profile.security.activityLogging}
                onCheckedChange={(checked) => setProfile({
                  ...profile,
                  security: {
                    ...profile.security,
                    activityLogging: checked
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveProfile}>Save Profile Settings</Button>
      </div>
    </div>
  );
}