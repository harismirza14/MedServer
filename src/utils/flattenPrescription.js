function flattenPrescription(p) {
  const obj = p.toJSON();
  return {
    ...obj,
    med_name: obj.Medication?.name ?? null,
    pharmacy_name: obj.Pharmacy?.name ?? null,
    pharmacy_zip: obj.Pharmacy?.zipcode ?? null,
    prescriber_id: obj.prescriber_id,
    prescriber_name: obj.Prescriber?.name ?? null,
    prescriber_role: obj.Prescriber?.role ?? null,
    patient_name: obj.Patient?.name ?? null,
    patient_id: obj.Patient?.patient_id ?? null,
    Medication: undefined,
    Pharmacy: undefined,
    Prescriber: undefined,
    Patient: undefined,
  };
}

module.exports = flattenPrescription;