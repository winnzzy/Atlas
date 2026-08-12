import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicContactDto } from '../dto/public-contact.dto';
import { PublicContactService } from '../public-contact.service';

/**
 * Unauthenticated, read-only surface for public site content such as the
 * footer contact information. No guards: this is intentionally public.
 */
@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly contactService: PublicContactService) {}

  @Get('contact')
  @ApiOperation({ summary: 'Public contact / footer information' })
  @ApiResponse({ status: 200, type: PublicContactDto })
  getContact(): Promise<PublicContactDto> {
    return this.contactService.getContact();
  }
}
