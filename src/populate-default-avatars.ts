import { createLogger } from './utils/create-logger';
import * as dotenv from 'dotenv';
import { createClientUsingEnvVars } from './utils/create-client-using-envvars';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  const ctClient = await createClientUsingEnvVars();
  logger.info(`Alkemio server: ${ctClient.config.graphqlEndpoint}`);
  await ctClient.validateConnection();

  const users = await ctClient.users();
  logger.info(`Users count: ${users?.length}`);
  if (users) {
    for (const user of users) {
      const avatar = user.profile?.avatar;
      logger.info(`user (${user.displayName}) has avatar: ${avatar}`);
      if (!avatar || avatar.length == 0) {
        const profileID = user.profile?.id;
        if (profileID) {
          const randomColor = Math.floor(Math.random() * 16777215).toString(16);
          await ctClient.updateProfile(
            profileID,
            `https://eu.ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=${randomColor}&color=ffffff`
          );
        }
      }
    }
  }
};

main().catch(error => {
  console.error(error);
});
