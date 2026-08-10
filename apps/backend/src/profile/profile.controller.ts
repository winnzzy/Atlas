import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
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
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(@Inject(ProfileService) private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the authenticated customer profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the authenticated customer profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, body);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get customer profile preferences' })
  @ApiOkResponse({ type: PreferencesResponseDto })
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update customer profile preferences' })
  @ApiOkResponse({ type: PreferencesResponseDto })
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdatePreferencesDto) {
    return this.profileService.updatePreferences(user.id, body);
  }

  @Get('security')
  @ApiOperation({ summary: 'Get customer profile security settings' })
  @ApiOkResponse({ type: SecurityResponseDto })
  getSecurity(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getSecurity(user.id);
  }

  @Patch('security')
  @ApiOperation({ summary: 'Update customer profile security settings' })
  @ApiOkResponse({ type: SecurityResponseDto })
  updateSecurity(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateSecurityDto) {
    return this.profileService.updateSecurity(user.id, body);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get customer profile activity feed' })
  @ApiOkResponse({ type: ActivityResponseDto })
  getActivity(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getActivity(user.id);
  }
}
