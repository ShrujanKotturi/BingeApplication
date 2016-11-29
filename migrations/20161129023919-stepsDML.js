'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('steps',
      [{ description: 'Step 1', checkList: 'Monitor your daily food and beverage consumption and physical activity,	Brainstorm ways to improve self-monitoring,	Reflect on any patterns of eating, weigh yourself once per week', createdAt: new Date(), updatedAt: new Date() },
      { description: 'Step 2', checkList: 'Each day plan regular meals and snacks,Restrict your eating to the day\’s meals and snacks, Do not skip any meals or snacks, Gaps between meals should be no longer than three to four hours, Do not eat between your meals and snacks, Each day plan on engaging in physical activity, Get back on track when things go wrong, Adjust the timing of your meals and snacks and physical activity to accommodate special situations, Follow the advice regarding self-induced vomiting and the misuse of laxative and diuretics, Set realistic goals for yourself in this program', createdAt: new Date(), updatedAt: new Date() },
      { description: 'Step 3', checkList: 'Make sure to include 2 servings of fruit and 3 servings of vegetables every day as part of your regular meals and snacks, Engage in 30 minutes of moderate physical activity every day, Re-evaluate your goals to ensure that they remain realistic', createdAt: new Date(), updatedAt: new Date() },
      { description: 'Step 4', checkList: 'Create a list of alternative activities to binge eating, Carry this list of alternative activities with you to use in difficult times, When the opportunity arises use your list of alternative activities to binge eating, Review the effectiveness of your alternative activities list, Make any necessary improvements to your alternative activities list,	Challenge any dichotomous thinking about food and physical activity', createdAt: new Date(), updatedAt: new Date() },
      { description: 'Step 5', checkList: '	Eat at regular intervals throughout the day, Eat normal quantities of food and do not restrict the overall amount that you eat,	Practice eating any food (that you like) until you do not feel anxious about eating it,	Tackle other forms of avoidance,Challenge any of your unrealistic expectations,	Set realistic goals for yourself', createdAt: new Date(), updatedAt: new Date() },
      { description: 'Step 6', checkList: 'Problem-solve whenever a difficult time occurs,	When problem-solving, follow the \“Six Steps of Efficient Problem Solving\”, Review your problem solving the next day, Establish a social support system', createdAt: new Date(), updatedAt: new Date() },
      { description: 'Step 7', checkList: 'Monitor your body image,	Reflect on any patterns in your body image,	Evaluate your progress in the program', createdAt: new Date(), updatedAt: new Date() }
      ])
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('steps', [{ description: 'Step 1' }, { description: 'Step 2' }, { description: 'Step 3' }, { description: 'Step 4' }, { description: 'Step 5' }, { description: 'Step 6' }, { description: 'Step 7' }])
  }
};
