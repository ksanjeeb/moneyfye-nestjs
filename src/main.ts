import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtGuard } from './auth/guards/jwt.guard';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './exception.filter';

const options = {
  swaggerOptions: {
    authAction: {
      defaultBearerAuth: {
        name: 'defaultBearerAuth',
        schema: {
          description: 'Default',
          type: 'http',
          in: 'header',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        value: 'thisIsASampleBearerAuthToken123',
      },
    },
  },
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new JwtGuard(app.get(Reflector)));
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  const config = new DocumentBuilder()
    .setTitle('Moneyfye')
    .setDescription('Moneyfye API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'defaultBearerAuth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const options = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup('api', app, document, options);
  await app.listen(3000);
}
bootstrap();
