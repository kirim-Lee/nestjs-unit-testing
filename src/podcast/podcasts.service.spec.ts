import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from './entities/episode.entity';

import { Podcast } from './entities/podcast.entity';
import { PodcastsService } from './podcasts.service';

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const serverErrorText = 'Internal server error occurred.';

describe('PodcastService', () => {
  let podcastService: PodcastsService;
  let podcastRepository: MockRepository<Podcast>;
  let episodeRepository: MockRepository<Episode>;

  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        PodcastsService,
        { provide: getRepositoryToken(Podcast), useValue: mockRepository },
        { provide: getRepositoryToken(Episode), useValue: mockRepository },
      ],
    }).compile();

    podcastService = modules.get<PodcastsService>(PodcastsService);
    podcastRepository = modules.get<MockRepository<Podcast>>(
      getRepositoryToken(Podcast),
    );
    episodeRepository = modules.get<MockRepository<Episode>>(
      getRepositoryToken(Episode),
    );
  });

  it('service be defined', () => {
    expect(podcastService).toBeDefined();
  });

  describe('getAllPodcasts', () => {
    it('should return all podcasts', async () => {
      const allPodcast = [
        { id: 1, title: 'abc', category: 'sf' },
        { id: 2, title: 'bcd', category: 'sf' },
      ];
      podcastRepository.find.mockResolvedValue(allPodcast);

      const result = await podcastService.getAllPodcasts();

      expect(podcastRepository.find).toHaveBeenCalledTimes(1);
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.podcasts).toEqual(allPodcast);
    });

    it('should return error', async () => {
      podcastRepository.find.mockImplementation(() => {
        throw Error();
      });
      const result = await podcastService.getAllPodcasts();

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });
});
