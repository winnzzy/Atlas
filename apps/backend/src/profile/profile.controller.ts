import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ProfileService } from './profile.service';
import {
  ActivityResponseDto,
  PreferencesResponseDto,
  ProfileResponseDto,
  SecurityResponseDto,
} from './dto/profile-response.dto';
import type { UpdatePreferencesDto } from './dto/update-preferences.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { UpdateSecurityDto } from './dto/update-security.dto';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated customer profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  getProfile() {
    return this.profileService.getProfile();
  }

  @Patch()
  @ApiOperation({ summary: 'Update the authenticated customer profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  updateProfile(@Body() body: UpdateProfileDto) {
    return this.profileService.updateProfile(body);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get customer profile preferences' })
  @ApiOkResponse({ type: PreferencesResponseDto })
  getPreferences() {
    return this.profileService.getPreferences();
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update customer profile preferences' })
  @ApiOkResponse({ type: PreferencesResponseDto })
  updatePreferences(@Body() body: UpdatePreferencesDto) {
    return this.profileService.updatePreferences(body);
  }

  @Get('security')
  @ApiOperation({ summary: 'Get customer profile security settings' })
  @ApiOkResponse({ type: SecurityResponseDto })
  getSecurity() {
    return this.profileService.getSecurity();
  }

  @Patch('security')
  @ApiOperation({ summary: 'Update customer profile security settings' })
  @ApiOkResponse({ type: SecurityResponseDto })
  updateSecurity(@Body() body: UpdateSecurityDto) {
    return this.profileService.updateSecurity(body);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get customer profile activity feed' })
  @ApiOkResponse({ type: ActivityResponseDto })
  getActivity() {
    return this.profileService.getActivity();
  }
}
