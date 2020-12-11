import { CherrytwistClient } from 'cherrytwist-lib';
import { Logger } from 'winston';
import { AbstractDataAdapter } from '../adapters/data-adapter';
import { AbstractPopulator } from './abstract-populator';

export class OpportunityPopulator extends AbstractPopulator {
  // Create the ecoverse with enough defaults set/ members populated
  constructor(
    client: CherrytwistClient,
    data: AbstractDataAdapter,
    logger: Logger,
    profiler: Logger
  ) {
    super(client, data, logger, profiler);
  }

  async populate() {
    this.logger.info('Processing opportunities');

    const opportunities = this.data.opportunities();

    if (opportunities.length === 0) {
      this.logger.warn('No opportunities to import!');
      return;
    }

    const challenges = await this.client.challenges();
    if (!challenges) {
      this.logger.error('Can not process opportunites. Missing challenges');
      return;
    }

    for (let i = 0; i < opportunities.length; i++) {
      const opportunity = opportunities[i];
      if (!opportunity.name) {
        // End of valid organisations
        break;
      }

      // start processing
      this.logger.info(`Processing opportunity: ${opportunity.name}....`);
      const opportunityProfileID = '===> opportunityCreation - FULL';
      this.profiler.profile(opportunityProfileID);

      const challenge = challenges.find(
        c => c.name.toLowerCase() === opportunity.challenge.toLowerCase()
      );

      if (!challenge) {
        this.logger.warn(
          `Skipping opportunity '${opportunity.name}'. Missing challenge '${opportunity.challenge}'!`
        );
        continue;
      }

      try {
        await this.client.createOpportunity(Number(challenge.id), {
          name: opportunity.name,
          textID: opportunity.textId,
          state: 'Defined',
          context: {
            background: opportunity.background,
            impact: opportunity.impact,
            who: opportunity.who,
            vision: opportunity.vision,
            tagline: opportunity.tagline,
            references: [
              {
                name: 'video',
                uri: opportunity.video,
                description: 'Video explainer for the opportunity',
              },
              {
                name: 'poster',
                uri: opportunity.image,
                description: 'Banner for the opportunity',
              },
            ],
          },
        });

        this.logger.info(`...added opportunity: ${opportunity.name}`);
      } catch (e) {
        if (e.response && e.response.errors) {
          this.logger.error(
            `Unable to create opportunity (${opportunity.name}): ${e.response.errors[0].message}`
          );
        } else {
          this.logger.error(`Could not create opportunity: ${e}`);
        }
      } finally {
        this.profiler.profile(opportunityProfileID);
      }
    }
  }
}
