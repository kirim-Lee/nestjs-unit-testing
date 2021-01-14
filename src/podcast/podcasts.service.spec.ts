import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from './entities/episode.entity';

import { Podcast } from './entities/podcast.entity';
import { PodcastsService } from './podcasts.service';

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const allPodcast = [
  { id: 1, title: 'abc', category: 'sf' },
  { id: 2, title: 'bcd', category: 'sf' },
];

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
      podcastRepository.find.mockResolvedValue(allPodcast);

      const result = await podcastService.getAllPodcasts();

      expect(podcastRepository.find).toHaveBeenCalledTimes(1);
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.podcasts).toEqual(allPodcast);
    });

    it('should return error when accure exception', async () => {
      podcastRepository.find.mockImplementation(() => {
        throw Error();
      });
      const result = await podcastService.getAllPodcasts();

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });

  describe('createPodcast', () => {
    const newPodcast = {
      title: 'new title',
      category: 'new category',
    };

    it('should create podcast', async () => {
      podcastRepository.create.mockReturnValue(newPodcast);
      podcastRepository.save.mockImplementation(podcast => ({
        id: 3,
        ...podcast,
      }));

      const result = await podcastService.createPodcast(newPodcast);

      expect(podcastRepository.create).toHaveBeenCalledTimes(1);
      expect(podcastRepository.create).toHaveBeenCalledWith(newPodcast);
      expect(podcastRepository.save).toBeCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith(newPodcast);
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.id).toBe(3);
    });

    it('should return error when accure exception', async () => {
      podcastRepository.create.mockImplementation(() => {
        throw Error();
      });
      const result = await podcastService.createPodcast(newPodcast);
      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });

  describe('getPodcast', () => {
    it('should return podcast', async () => {
      podcastRepository.findOne.mockResolvedValue(allPodcast[0]);

      const result = await podcastService.getPodcast(1);

      expect(podcastRepository.findOne).toHaveBeenCalledTimes(1);
      expect(podcastRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        expect.any(Object),
      );
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.podcast).toEqual(allPodcast[0]);
    });

    it('shoud return error when id is not exist', async () => {
      jest.spyOn(console, 'log');
      podcastRepository.findOne.mockResolvedValue(null);

      const result = await podcastService.getPodcast(1);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('Podcast with id 1 not found');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(console, 'log');
      podcastRepository.findOne.mockImplementation(() => {
        throw Error();
      });

      const result = await podcastService.getPodcast(1);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  });
});
