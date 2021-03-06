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
  delete: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('service be defined', () => {
    expect(podcastService).toBeDefined();
  });

  const serverErrorText = 'Internal server error occurred.';

  const allPodcast = [
    { id: 1, title: 'abc', category: 'sf' },
    { id: 2, title: 'bcd', category: 'sf' },
  ];

  const allEpisode = [
    { id: 3, title: 'epi1', category: 'fs' },
    { id: 4, title: 'epi2', category: 'fs' },
  ];

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

  describe('deletePodcast', () => {
    it('should delete success if exist', async () => {
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({ ok: true });

      const result = await podcastService.deletePodcast(1);

      expect(podcastService.getPodcast).toHaveBeenCalledTimes(1);
      expect(podcastService.getPodcast).toHaveBeenCalledWith(1);
      expect(podcastRepository.delete).toHaveBeenCalledTimes(1);
      expect(podcastRepository.delete).toHaveBeenCalledWith({ id: 1 });
      expect(result.ok).toBeTruthy();
    });

    it('should delete fail if not exist', async () => {
      jest
        .spyOn(podcastService, 'getPodcast')
        .mockResolvedValue({ ok: false, error: 'not exist' });

      const result = await podcastService.deletePodcast(1);

      expect(podcastRepository.delete).not.toHaveBeenCalledTimes(1);
      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('not exist');
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(console, 'log');
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({ ok: true });
      podcastRepository.delete.mockImplementation(() => {
        throw Error();
      });

      const result = await podcastService.deletePodcast(1);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePodcast', () => {
    const updatePodcast = {
      id: 1,
      payload: { title: 'update', category: 'category', rating: 5 },
    };

    it('should success update podcast', async () => {
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: { id: 1, title: 'some', category: 'thing', rating: 2 } as any,
      });

      const result = await podcastService.updatePodcast(updatePodcast);

      expect(updatePodcast.payload['rating']).toEqual(expect.any(Number));
      expect(podcastService.getPodcast).toHaveBeenCalledTimes(1);
      expect(podcastService.getPodcast).toHaveBeenCalledWith(1);
      expect(podcastRepository.save).toHaveBeenCalledTimes(1);
      expect(podcastRepository.save).toHaveBeenCalledWith({
        id: 1,
        ...updatePodcast.payload,
      });
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should success update rating undefined', async () => {
      const withoutRatingPayload = { title: 'update', category: 'category' };
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: { id: 1, title: 'some', category: 'thing', rating: 2 } as any,
      });
      const result = await podcastService.updatePodcast({
        id: 1,
        payload: withoutRatingPayload,
      });

      expect(withoutRatingPayload['rating']).toBeUndefined();
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should delete fail if not exist', async () => {
      jest
        .spyOn(podcastService, 'getPodcast')
        .mockResolvedValue({ ok: false, error: 'not exist' });

      const result = await podcastService.updatePodcast(updatePodcast);

      expect(podcastRepository.save).not.toHaveBeenCalledTimes(1);
      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('not exist');
    });

    it('should return error when rating is over range', async () => {
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: { id: 1, title: 'some', category: 'thing', rating: 2 } as any,
      });
      const { id, payload } = updatePodcast;

      const result = await podcastService.updatePodcast({
        id,
        payload: { ...payload, rating: 5.1 },
      });

      expect(podcastRepository.save).not.toHaveBeenCalledTimes(1);
      expect(result.ok).toBeFalsy();
      expect(result.error).toBe('Rating must be between 1 and 5.');
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(console, 'log');
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({ ok: true });
      podcastRepository.save.mockImplementation(() => {
        throw Error();
      });

      const result = await podcastService.updatePodcast(updatePodcast);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEpisodes', () => {
    it('should return all episodes', async () => {
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: { episodes: allEpisode } as any,
      });

      const result = await podcastService.getEpisodes(1);

      expect(podcastService.getPodcast).toHaveBeenCalledTimes(1);
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.episodes).toEqual(allEpisode);
    });

    it('should return error if podcast is not exist', async () => {
      const error = 'podcast is not exist';
      jest.spyOn(podcastService, 'getPodcast').mockResolvedValue({
        ok: false,
        error,
      });

      const result = await podcastService.getEpisodes(1);
      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(error);
      expect(result.episodes).toBeUndefined();
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(podcastService, 'getPodcast').mockImplementation(() => {
        throw Error();
      });
      const result = await podcastService.getEpisodes(1);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });

  describe('getEpisode', () => {
    it('should return episode', async () => {
      const episodesResult = { ok: true, episodes: allEpisode as any };
      const episodeFind = jest.spyOn(episodesResult.episodes, 'find');
      jest
        .spyOn(podcastService, 'getEpisodes')
        .mockResolvedValue(episodesResult);

      const result = await podcastService.getEpisode({
        podcastId: 1,
        episodeId: 3,
      });

      expect(podcastService.getEpisodes).toHaveBeenCalledTimes(1);
      expect(podcastService.getEpisodes).toHaveBeenCalledWith(1);
      expect(episodeFind).toHaveBeenCalledTimes(1);
      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.episode).toEqual(allEpisode[0]);
    });

    it('should return error if podcast is not exist', async () => {
      const error = 'podcast is not exist';
      jest
        .spyOn(podcastService, 'getEpisodes')
        .mockResolvedValue({ ok: false, error });

      const result = await podcastService.getEpisode({
        podcastId: 1,
        episodeId: 3,
      });

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(error);
      expect(result.episode).toBeUndefined();
    });

    it('should return error when episode is not exist', async () => {
      const episodesResult = { ok: true, episodes: allEpisode as any };
      jest.spyOn(episodesResult.episodes, 'find').mockReturnValue(null);
      jest
        .spyOn(podcastService, 'getEpisodes')
        .mockResolvedValue(episodesResult);
      const result = await podcastService.getEpisode({
        podcastId: 1,
        episodeId: 1,
      });

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(
        'Episode with id 1 not found in podcast with id 1',
      );
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(podcastService, 'getEpisodes').mockImplementation(() => {
        throw Error();
      });

      const result = await podcastService.getEpisode({
        podcastId: 1,
        episodeId: 1,
      });

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });

  describe('createEpisode', () => {
    const payload = { title: 'episode title', category: ' episode category' };
    const createEpisodeInput = {
      podcastId: 1,
      ...payload,
    };

    it('should create episode', async () => {
      jest
        .spyOn(podcastService, 'getPodcast')
        .mockResolvedValue({ ok: true, podcast: allPodcast[0] as any });
      episodeRepository.create.mockReturnValue(payload);
      episodeRepository.save.mockResolvedValue({ id: 5 });

      const result = await podcastService.createEpisode(createEpisodeInput);

      expect(podcastService.getPodcast).toHaveBeenCalledTimes(1);
      expect(podcastService.getPodcast).toHaveBeenCalledWith(1);

      expect(episodeRepository.create).toHaveBeenCalledTimes(1);
      expect(episodeRepository.create).toHaveBeenCalledWith({
        ...payload,
        podcast: allPodcast[0],
      });

      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith(payload);

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
      expect(result.id).toBe(5);
    });

    it('shoud return error if podcast is not exist', async () => {
      const error = 'podcast is not exist';
      jest
        .spyOn(podcastService, 'getPodcast')
        .mockResolvedValue({ ok: false, error });

      const result = await podcastService.createEpisode(createEpisodeInput);

      expect(result.ok).toBeFalsy();
      expect(result.id).toBeUndefined();
      expect(result.error).toBe(error);
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(podcastService, 'getPodcast').mockImplementation(() => {
        throw Error();
      });
      const result = await podcastService.createEpisode(createEpisodeInput);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });

  describe('deleteEpisode', () => {
    const deleteInput = { podcastId: 1, episodeId: 3 };

    it('should success delete ', async () => {
      episodeRepository.delete.mockResolvedValue(true);

      jest
        .spyOn(podcastService, 'getEpisode')
        .mockResolvedValue({ ok: true, episode: { id: 3 } as any });

      const result = await podcastService.deleteEpisode(deleteInput);

      expect(podcastService.getEpisode).toHaveBeenCalledTimes(1);
      expect(podcastService.getEpisode).toHaveBeenCalledWith(deleteInput);

      expect(episodeRepository.delete).toHaveBeenCalledTimes(1);
      expect(episodeRepository.delete).toHaveBeenCalledWith({
        id: 3,
      });

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should return error if episode is not exist ', async () => {
      const error = 'episode is not exist';

      jest
        .spyOn(podcastService, 'getEpisode')
        .mockResolvedValue({ ok: false, error });
      const result = await podcastService.deleteEpisode(deleteInput);

      expect(episodeRepository.delete).not.toHaveBeenCalledTimes(1);
      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(error);
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(podcastService, 'getEpisode').mockImplementation(() => {
        throw Error();
      });
      const result = await podcastService.deleteEpisode(deleteInput);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });

  describe('updateEpisode', () => {
    const payload = {
      title: 'episode title',
      category: ' episode category',
    };
    const ids = { podcastId: 1, episodeId: 3 };
    const updateInput = { ...ids, ...payload };

    it('should success update', async () => {
      jest
        .spyOn(podcastService, 'getEpisode')
        .mockResolvedValue({ ok: true, episode: {} as any });

      episodeRepository.save.mockResolvedValue(true);

      const result = await podcastService.updateEpisode(updateInput);

      expect(podcastService.getEpisode).toHaveBeenCalledTimes(1);
      expect(podcastService.getEpisode).toHaveBeenCalledWith(ids);

      expect(episodeRepository.save).toHaveBeenCalledTimes(1);
      expect(episodeRepository.save).toHaveBeenCalledWith(payload);

      expect(result.ok).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('shoud return error if episode is not exist', async () => {
      const error = 'episode is not exist';

      jest
        .spyOn(podcastService, 'getEpisode')
        .mockResolvedValue({ ok: false, error });

      const result = await podcastService.updateEpisode(updateInput);

      expect(episodeRepository.save).not.toHaveBeenCalledTimes(1);
      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(error);
    });

    it('should return error when accure exception', async () => {
      jest.spyOn(podcastService, 'getEpisode').mockImplementation(() => {
        throw Error();
      });
      const result = await podcastService.updateEpisode(updateInput);

      expect(result.ok).toBeFalsy();
      expect(result.error).toBe(serverErrorText);
    });
  });
});
