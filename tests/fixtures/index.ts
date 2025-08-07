import path from 'path';

export const fixtures = {
  model: path.resolve(__dirname, 'model.jpg'),
  apparel: path.resolve(__dirname, 'apparel.jpg'),
  stub: require('./openai-edit-success.json')
};
