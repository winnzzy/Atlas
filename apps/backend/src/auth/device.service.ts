import { Injectable } from '@nestjs/common';

@Injectable()
export class DeviceService {
  deriveDeviceInfo(input: {
    userAgent?: string;
    ipAddress?: string;
    explicitDeviceId?: string;
    explicitDeviceName?: string;
  }): {
    deviceId: string;
    deviceName: string;
    userAgent: string;
    ipAddress: string;
  } {
    const userAgent = input.userAgent?.trim() || 'Unknown Agent';
    const ipAddress = input.ipAddress?.trim() || '0.0.0.0';
    const deviceName = input.explicitDeviceName?.trim() || this.deriveNameFromUserAgent(userAgent);

    const deviceId =
      input.explicitDeviceId?.trim() || this.deriveDeviceId({ userAgent, ipAddress, deviceName });

    return {
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
    };
  }

  private deriveNameFromUserAgent(userAgent: string): string {
    if (!userAgent || userAgent === 'Unknown Agent') {
      return 'Unknown Device';
    }

    const token = userAgent.split(' ').find((part) => part.includes('/'));
    return token ? token.replace('/', ' ') : 'Customer Device';
  }

  private deriveDeviceId(input: {
    userAgent: string;
    ipAddress: string;
    deviceName: string;
  }): string {
    const raw = `${input.userAgent}|${input.ipAddress}|${input.deviceName}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i += 1) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `dev_${Math.abs(hash).toString(16)}`;
  }
}
