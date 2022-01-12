import { Request, Response } from 'express';
import { Service } from 'typedi';

@Service()
export default class LifecycleEventController {
  handleUninstalledEvent = (request: Request, response: Response): void => {
    response.status(204).send();
  };
}
