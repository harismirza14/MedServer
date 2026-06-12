const { Prescription } = require('./models');
const deletealldata = async (prescriptionId) => {
  try {
    const result = await Prescription.destroy({
      where: { prescription_id: prescriptionId }
    });
    
    if (result === 1) {
      console.log(`Prescription with ID ${prescriptionId} deleted successfully.`);
    } else {
      console.log(`No prescription found with ID ${prescriptionId}.`);
    }
    return result; // returns number of deleted rows (0 or 1)
  } catch (error) {
    console.error('Error deleting prescription:', error);
    throw error;
  }
};

// Usage example
deletealldata(15);