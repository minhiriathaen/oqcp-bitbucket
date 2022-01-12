import AtlassianConnectService from '../atlassian-connect.service';

describe('AtlassianConnectService', () => {
  describe('getHttpClient', () => {
    const mockAddon = {
      httpClient: jest.fn(),
    };

    it('should call addon.httpClient() if the service is initialized', () => {
      const atlassianConnectService: AtlassianConnectService = new AtlassianConnectService(
        mockAddon as any,
        {} as any,
      );

      const request = {};
      atlassianConnectService.getHttpClient(request as any);

      expect(mockAddon.httpClient).toHaveBeenCalledWith(request);
    });
  });
});
