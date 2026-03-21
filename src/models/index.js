import { Sequelize } from 'sequelize';
import dbConfig from '../common/config/db.config.js';
import User from './User.js';
import DeviceToken from './DeviceToken.js';
import Admin from './Admin.js';
import City from './City.js';
import Interest from './Interest.js';
import UserInterest from './UserInterest.js';
import RegistrationOtp from './RegistrationOtp.js';
import UserAvailabilitySlot from './UserAvailabilitySlot.js';
import SiteContent from './SiteContent.js';
import SupportMessage from './SupportMessage.js';
import UserGroup from './UserGroup.js';
import WalletAccount from './WalletAccount.js';
import WalletTransaction from './WalletTransaction.js';
import Booking from './Booking.js';
import Notification from './Notification.js';

const sequelize = new Sequelize(dbConfig.url, {
    ...dbConfig,
});

const models = {
    Admin: Admin(sequelize, Sequelize.DataTypes),
    User: User(sequelize, Sequelize.DataTypes),
    DeviceToken: DeviceToken(sequelize, Sequelize.DataTypes),
    City: City(sequelize, Sequelize.DataTypes),
    Interest: Interest(sequelize, Sequelize.DataTypes),
    UserInterest: UserInterest(sequelize, Sequelize.DataTypes),
    RegistrationOtp: RegistrationOtp(sequelize, Sequelize.DataTypes),
    UserAvailabilitySlot: UserAvailabilitySlot(sequelize, Sequelize.DataTypes),
    SiteContent: SiteContent(sequelize, Sequelize.DataTypes),
    SupportMessage: SupportMessage(sequelize, Sequelize.DataTypes),
    UserGroup: UserGroup(sequelize, Sequelize.DataTypes),
    WalletAccount: WalletAccount(sequelize, Sequelize.DataTypes),
    WalletTransaction: WalletTransaction(sequelize, Sequelize.DataTypes),
    Booking: Booking(sequelize, Sequelize.DataTypes),
    Notification: Notification(sequelize, Sequelize.DataTypes),
};

// Setup associations
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;