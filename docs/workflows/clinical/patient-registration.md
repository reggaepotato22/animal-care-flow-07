# Patient Registration

Clinical workflow for registering a new patient in the system.

## Overview

Patient registration captures animal and owner information so the practice can schedule visits, maintain records, and contact owners. Complete registration is required before creating clinical records or appointments for the patient.

## Entry Point

- **Navigation:** Patients → Add Patient  
- **Route:** `/patients/add`

## Workflow Steps

### 1. Patient (animal) information

- **Name** – Pet name (required)
- **Species** – e.g. Dog, Cat, Rabbit (required)
- **Breed** – (required)
- **Age** – (required)
- **Weight** – (required)
- **Gender** – (required)
- **Color** – (required)

### 2. Owner information

- **Owner name** – (required)
- **Phone** – (required)
- **Email** – Valid email (required)
- **Address** – (required)

### 3. Emergency contact

- **Emergency contact name** – (required)
- **Emergency contact phone** – (required)

### 4. Medical background (optional)

- **Medical history** – Free text
- **Surgeries** – Free text
- **Chronic conditions** – Free text
- **Allergies** – List/tags
- **Current medications** – List/tags
- **Vaccinations** – List/tags

### 5. Save and confirm

- Validate all required fields.
- Generate patient ID and save the record.
- Redirect to the new patient’s detail page or patient list.

## Post-registration

- Patient is available for:
  - Appointments
  - Clinical records (visits, treatments)
  - Lab orders and results
  - Hospitalization and triage

## Related

- [Patients list](/patients) – View and search registered patients
- [Patient details](/patients/:id) – View and edit a single patient
