// Strings for the auth + onboarding screens (login, signup, personal-data,
// activity-goal, meals-per-day). Owned by the auth screen group.
// `en` = default/source, `es` = Spanish. Filled during the i18n migration.

export const en: Record<string, string> = {
  // login
  'auth.login.title': 'Sign in',
  'auth.login.subtitle': 'Welcome back',
  'auth.login.passwordLabel': 'Password',
  'auth.login.passwordPlaceholder': 'Password',
  'auth.login.submitButton': 'Sign in',
  'auth.login.orDivider': 'or',
  'auth.login.googleButton': 'Continue with Google',
  'auth.login.noAccount': "Don't have an account? Sign up",

  // signup
  'auth.signup.title': 'Create account',
  'auth.signup.subtitle': 'Start your FitAI experience',
  'auth.signup.nameLabel': 'Name',
  'auth.signup.namePlaceholder': 'Name',
  'auth.signup.passwordLabel': 'Password',
  'auth.signup.passwordPlaceholder': 'Password',
  'auth.signup.submitButton': 'Create account',
  'auth.signup.orDivider': 'or',
  'auth.signup.googleButton': 'Continue with Google',
  'auth.signup.hasAccount': 'Already have an account? Sign in',

  // personal-data
  'auth.personalData.title': 'Your data',
  'auth.personalData.subtitle': 'We need to get to know you a little better',
  'auth.personalData.sexLabel': 'Sex',
  'auth.personalData.sexMale': 'Male',
  'auth.personalData.sexFemale': 'Female',
  'auth.personalData.birthDateLabel': 'Date of birth',
  'auth.personalData.birthDatePlaceholder': 'YYYY-MM-DD',
  'auth.personalData.heightLabel': 'Height (cm)',
  'auth.personalData.heightPlaceholder': 'Height (cm)',
  'auth.personalData.weightLabel': 'Weight (kg)',
  'auth.personalData.weightPlaceholder': 'Weight (kg)',
  'auth.personalData.nextButton': 'Next',
  'auth.personalData.errorSex': 'Please select your sex.',
  'auth.personalData.errorBirthDate': 'Enter a valid date of birth (YYYY-MM-DD).',
  'auth.personalData.errorHeight': 'Enter a valid height in cm.',
  'auth.personalData.errorWeight': 'Enter a valid weight in kg.',

  // activity-goal
  'auth.activityGoal.title': 'Activity & goal',
  'auth.activityGoal.subtitle': 'Customise your nutrition plan',
  'auth.activityGoal.activityLabel': 'Activity level',
  'auth.activityGoal.goalLabel': 'Goal',
  'auth.activityGoal.nextButton': 'Next',
  'auth.activityGoal.errorActivity': 'Please select your activity level.',
  'auth.activityGoal.errorGoal': 'Please select your goal.',
  'auth.activityGoal.sedentary': 'Sedentary',
  'auth.activityGoal.light': 'Light',
  'auth.activityGoal.moderate': 'Moderate',
  'auth.activityGoal.active': 'Active',
  'auth.activityGoal.veryActive': 'Very active',
  'auth.activityGoal.loseFat': 'Lose fat',
  'auth.activityGoal.maintain': 'Maintain',
  'auth.activityGoal.gainMuscle': 'Gain muscle',

  // meals-per-day
  'auth.mealsPerDay.title': 'How many meals a day do you prefer?',
  'auth.mealsPerDay.subtitle': 'We will adapt your plan to your routine',
  'auth.mealsPerDay.3meals': '3 meals (breakfast, lunch, dinner)',
  'auth.mealsPerDay.56meals': '5-6 meals (with snacks)',
  'auth.mealsPerDay.errorMissingData': 'Missing data. Go back and complete the previous steps.',

  // ─── Wizard questionnaire (auth.q.*) ────────────────────────────────────────

  // shared wizard chrome
  'auth.q.back': 'Back',
  'auth.q.continue': 'Continue',
  'auth.q.skip': 'Skip',
  'auth.q.finish': 'Finish',
  'auth.q.stepOf': 'Step {current} of {total}',
  'auth.q.errorMissingRequired': 'Missing required data. Please go back and complete all steps.',

  // step 1 — sex
  'auth.q.sex.title': 'What is your biological sex?',
  'auth.q.sex.subtitle': 'Used to calculate your metabolic rate accurately.',
  'auth.q.sex.male': 'Male',
  'auth.q.sex.female': 'Female',

  // step 2 — birth date
  'auth.q.birthDate.title': 'When were you born?',
  'auth.q.birthDate.subtitle': 'Your age is a key factor in your nutrition plan.',
  'auth.q.birthDate.placeholder': 'YYYY-MM-DD',
  'auth.q.birthDate.error': 'Enter a valid date of birth in the past (YYYY-MM-DD).',

  // step 3 — height
  'auth.q.height.title': 'How tall are you?',
  'auth.q.height.subtitle': 'Used to estimate your energy needs.',
  'auth.q.height.placeholder': 'Height in cm',
  'auth.q.height.error': 'Enter a valid height greater than 0.',

  // step 4 — weight
  'auth.q.weight.title': 'What is your current weight?',
  'auth.q.weight.subtitle': 'We will track your progress over time.',
  'auth.q.weight.placeholder': 'Weight in kg',
  'auth.q.weight.error': 'Enter a valid weight greater than 0.',

  // step 5 — body fat % (optional)
  'auth.q.bodyFat.title': 'Do you know your body fat percentage?',
  'auth.q.bodyFat.subtitle': 'Optional — enables a more accurate lean-mass calculation.',
  'auth.q.bodyFat.placeholder': 'Body fat %',
  'auth.q.bodyFat.error': 'Enter a value between 1 and 70.',

  // step 6 — activity level
  'auth.q.activityLevel.title': 'How active are you day-to-day?',
  'auth.q.activityLevel.subtitle': 'Think about your job and daily movement, not exercise.',
  'auth.q.activityLevel.sedentary': 'Sedentary',
  'auth.q.activityLevel.sedentaryDesc': 'Mostly sitting (desk job, little movement)',
  'auth.q.activityLevel.light': 'Light',
  'auth.q.activityLevel.lightDesc': 'Light movement 1–3 days/week',
  'auth.q.activityLevel.moderate': 'Moderate',
  'auth.q.activityLevel.moderateDesc': 'Moderate activity 3–5 days/week',
  'auth.q.activityLevel.active': 'Active',
  'auth.q.activityLevel.activeDesc': 'Hard exercise 6–7 days/week',
  'auth.q.activityLevel.veryActive': 'Very active',
  'auth.q.activityLevel.veryActiveDesc': 'Very hard exercise or physical job',

  // step 7 — training days (optional)
  'auth.q.trainingDays.title': 'How many days per week do you train?',
  'auth.q.trainingDays.subtitle': 'Optional — helps us fine-tune your macros.',

  // step 8 — goal
  'auth.q.goal.title': 'What is your primary goal?',
  'auth.q.goal.subtitle': 'We will calibrate your calorie and macro targets accordingly.',
  'auth.q.goal.loseFat': 'Lose fat',
  'auth.q.goal.maintain': 'Maintain',
  'auth.q.goal.gainMuscle': 'Gain muscle',

  // step 9 — target weight (conditional, optional)
  'auth.q.targetWeight.title': 'What is your target weight?',
  'auth.q.targetWeight.subtitle': 'Optional — helps us set a timeline for your goal.',
  'auth.q.targetWeight.placeholder': 'Target weight in kg',
  'auth.q.targetWeight.error': 'Enter a valid target weight greater than 0.',

  // step 10 — pace (conditional)
  'auth.q.pace.title': 'How fast do you want to progress?',
  'auth.q.pace.subtitle': 'Faster is not always better — sustainable change lasts longer.',
  'auth.q.pace.conservative': 'Conservative (~0.25 kg/week)',
  'auth.q.pace.moderate': 'Moderate (~0.5 kg/week)',
  'auth.q.pace.aggressive': 'Aggressive (~0.75 kg/week)',

  // step 11 — diet style
  'auth.q.dietStyle.title': 'Which diet style suits you best?',
  'auth.q.dietStyle.subtitle': 'We will build your meal plan around your preference.',
  'auth.q.dietStyle.standard': 'Balanced',
  'auth.q.dietStyle.highProtein': 'High protein',
  'auth.q.dietStyle.keto': 'Keto',
  'auth.q.dietStyle.vegetarianVegan': 'Vegetarian or vegan',

  // step 12 — allergies (optional, multi)
  'auth.q.allergies.title': 'Any food allergies or intolerances?',
  'auth.q.allergies.subtitle': 'Optional — select all that apply.',
  'auth.q.allergies.none': 'None',
  'auth.q.allergies.gluten': 'Gluten',
  'auth.q.allergies.lactose': 'Lactose',
  'auth.q.allergies.nuts': 'Nuts',
  'auth.q.allergies.shellfish': 'Shellfish',
  'auth.q.allergies.eggs': 'Eggs',
  'auth.q.allergies.soy': 'Soy',
  'auth.q.allergies.fish': 'Fish',

  // step 13 — meals per day
  'auth.q.meals.title': 'How many meals a day do you prefer?',
  'auth.q.meals.subtitle': 'We will adapt your plan to your routine.',
  'auth.q.meals.3': '3 meals (breakfast, lunch, dinner)',
  'auth.q.meals.56': '5–6 meals (with snacks)',

  // step 14 — pregnancy (conditional, female only)
  'auth.q.pregnancy.title': 'Are you pregnant or breastfeeding?',
  'auth.q.pregnancy.subtitle': 'Calorie and nutrient needs increase significantly during this time. Always consult a healthcare professional.',
  'auth.q.pregnancy.none': 'No',
  'auth.q.pregnancy.pregnant': 'Pregnant',
  'auth.q.pregnancy.breastfeeding': 'Breastfeeding',

  // step 15 — medical conditions (optional, multi)
  'auth.q.medical.title': 'Any medical conditions we should know about?',
  'auth.q.medical.subtitle': 'Optional. For certain conditions, consult a healthcare professional before following any nutrition plan.',
  'auth.q.medical.none': 'None',
  'auth.q.medical.diabetesT1': 'Type 1 diabetes',
  'auth.q.medical.diabetesT2': 'Type 2 diabetes',
  'auth.q.medical.hypertension': 'Hypertension',
  'auth.q.medical.hypothyroidism': 'Hypothyroidism',
  'auth.q.medical.kidneyDisease': 'Kidney disease',

  // step 16 — sleep (optional)
  'auth.q.sleep.title': 'How many hours do you sleep per night?',
  'auth.q.sleep.subtitle': 'Optional — sleep quality impacts recovery and metabolism.',
  'auth.q.sleep.placeholder': 'Hours per night',
  'auth.q.sleep.error': 'Enter a value between 1 and 24.',

  // step 17 — stress (optional)
  'auth.q.stress.title': 'How would you describe your stress level?',
  'auth.q.stress.subtitle': 'Optional — chronic stress can affect weight and recovery.',
  'auth.q.stress.low': 'Low',
  'auth.q.stress.medium': 'Medium',
  'auth.q.stress.high': 'High',

  // step 18 — water intake (optional)
  'auth.q.water.title': 'How many glasses of water do you drink daily?',
  'auth.q.water.subtitle': 'Optional — one glass ≈ 250 ml.',
  'auth.q.water.placeholder': 'Glasses per day',
  'auth.q.water.error': 'Enter a value between 0 and 50.',

  // step 19 — review
  'auth.q.review.title': 'Review your profile',
  'auth.q.review.subtitle': 'Everything look good? Tap Finish to create your personalised plan.',
  'auth.q.review.sex': 'Biological sex',
  'auth.q.review.birthDate': 'Date of birth',
  'auth.q.review.height': 'Height',
  'auth.q.review.weight': 'Current weight',
  'auth.q.review.bodyFat': 'Body fat',
  'auth.q.review.activityLevel': 'Activity level',
  'auth.q.review.trainingDays': 'Training days/week',
  'auth.q.review.goal': 'Goal',
  'auth.q.review.targetWeight': 'Target weight',
  'auth.q.review.pace': 'Weekly pace',
  'auth.q.review.dietStyle': 'Diet style',
  'auth.q.review.allergies': 'Allergies',
  'auth.q.review.meals': 'Meals per day',
  'auth.q.review.pregnancy': 'Pregnancy status',
  'auth.q.review.medical': 'Medical conditions',
  'auth.q.review.sleep': 'Sleep',
  'auth.q.review.stress': 'Stress level',
  'auth.q.review.water': 'Water intake',
  'auth.q.review.notSet': 'Not set',
  'auth.q.review.cmUnit': 'cm',
  'auth.q.review.kgUnit': 'kg',
  'auth.q.review.hrsUnit': 'hrs/night',
  'auth.q.review.mlUnit': 'ml/day',
  'auth.q.review.daysUnit': 'days/week',
  'auth.q.review.pctUnit': '%',
};

export const es: Record<string, string> = {
  // login
  'auth.login.title': 'Iniciar sesión',
  'auth.login.subtitle': 'Bienvenido de nuevo',
  'auth.login.passwordLabel': 'Contraseña',
  'auth.login.passwordPlaceholder': 'Contraseña',
  'auth.login.submitButton': 'Entrar',
  'auth.login.orDivider': 'o',
  'auth.login.googleButton': 'Continuar con Google',
  'auth.login.noAccount': '¿No tienes cuenta? Regístrate',

  // signup
  'auth.signup.title': 'Crear cuenta',
  'auth.signup.subtitle': 'Empieza tu experiencia FitAI',
  'auth.signup.nameLabel': 'Nombre',
  'auth.signup.namePlaceholder': 'Nombre',
  'auth.signup.passwordLabel': 'Contraseña',
  'auth.signup.passwordPlaceholder': 'Contraseña',
  'auth.signup.submitButton': 'Crear cuenta',
  'auth.signup.orDivider': 'o',
  'auth.signup.googleButton': 'Continuar con Google',
  'auth.signup.hasAccount': '¿Ya tienes cuenta? Inicia sesión',

  // personal-data
  'auth.personalData.title': 'Tus datos',
  'auth.personalData.subtitle': 'Necesitamos conocerte un poco mejor',
  'auth.personalData.sexLabel': 'Sexo',
  'auth.personalData.sexMale': 'Hombre',
  'auth.personalData.sexFemale': 'Mujer',
  'auth.personalData.birthDateLabel': 'Fecha de nacimiento',
  'auth.personalData.birthDatePlaceholder': 'AAAA-MM-DD',
  'auth.personalData.heightLabel': 'Altura (cm)',
  'auth.personalData.heightPlaceholder': 'Altura (cm)',
  'auth.personalData.weightLabel': 'Peso (kg)',
  'auth.personalData.weightPlaceholder': 'Peso (kg)',
  'auth.personalData.nextButton': 'Siguiente',
  'auth.personalData.errorSex': 'Selecciona tu sexo.',
  'auth.personalData.errorBirthDate': 'Introduce una fecha de nacimiento válida (AAAA-MM-DD).',
  'auth.personalData.errorHeight': 'Introduce una altura válida en cm.',
  'auth.personalData.errorWeight': 'Introduce un peso válido en kg.',

  // activity-goal
  'auth.activityGoal.title': 'Actividad y objetivo',
  'auth.activityGoal.subtitle': 'Personaliza tu plan de nutrición',
  'auth.activityGoal.activityLabel': 'Nivel de actividad',
  'auth.activityGoal.goalLabel': 'Objetivo',
  'auth.activityGoal.nextButton': 'Siguiente',
  'auth.activityGoal.errorActivity': 'Selecciona tu nivel de actividad.',
  'auth.activityGoal.errorGoal': 'Selecciona tu objetivo.',
  'auth.activityGoal.sedentary': 'Sedentario',
  'auth.activityGoal.light': 'Ligero',
  'auth.activityGoal.moderate': 'Moderado',
  'auth.activityGoal.active': 'Activo',
  'auth.activityGoal.veryActive': 'Muy activo',
  'auth.activityGoal.loseFat': 'Bajar grasa',
  'auth.activityGoal.maintain': 'Mantener',
  'auth.activityGoal.gainMuscle': 'Ganar músculo',

  // meals-per-day
  'auth.mealsPerDay.title': '¿Cuántas comidas al día prefieres?',
  'auth.mealsPerDay.subtitle': 'Adaptaremos tu plan a tu rutina',
  'auth.mealsPerDay.3meals': '3 comidas (desayuno, comida, cena)',
  'auth.mealsPerDay.56meals': '5-6 comidas (con snacks)',
  'auth.mealsPerDay.errorMissingData': 'Faltan datos. Vuelve atrás y completa los pasos anteriores.',

  // ─── Wizard questionnaire (auth.q.*) ────────────────────────────────────────

  // shared wizard chrome
  'auth.q.back': 'Atrás',
  'auth.q.continue': 'Continuar',
  'auth.q.skip': 'Omitir',
  'auth.q.finish': 'Finalizar',
  'auth.q.stepOf': 'Paso {current} de {total}',
  'auth.q.errorMissingRequired': 'Faltan datos obligatorios. Por favor, vuelve atrás y completa todos los pasos.',

  // step 1 — sex
  'auth.q.sex.title': '¿Cuál es tu sexo biológico?',
  'auth.q.sex.subtitle': 'Lo usamos para calcular tu tasa metabólica con precisión.',
  'auth.q.sex.male': 'Hombre',
  'auth.q.sex.female': 'Mujer',

  // step 2 — birth date
  'auth.q.birthDate.title': '¿Cuándo naciste?',
  'auth.q.birthDate.subtitle': 'Tu edad es un factor clave en tu plan de nutrición.',
  'auth.q.birthDate.placeholder': 'AAAA-MM-DD',
  'auth.q.birthDate.error': 'Introduce una fecha de nacimiento válida en el pasado (AAAA-MM-DD).',

  // step 3 — height
  'auth.q.height.title': '¿Cuánto mides?',
  'auth.q.height.subtitle': 'Lo usamos para estimar tus necesidades energéticas.',
  'auth.q.height.placeholder': 'Altura en cm',
  'auth.q.height.error': 'Introduce una altura válida mayor que 0.',

  // step 4 — weight
  'auth.q.weight.title': '¿Cuánto pesas actualmente?',
  'auth.q.weight.subtitle': 'Seguiremos tu progreso a lo largo del tiempo.',
  'auth.q.weight.placeholder': 'Peso en kg',
  'auth.q.weight.error': 'Introduce un peso válido mayor que 0.',

  // step 5 — body fat % (optional)
  'auth.q.bodyFat.title': '¿Sabes tu porcentaje de grasa corporal?',
  'auth.q.bodyFat.subtitle': 'Opcional — permite un cálculo de masa magra más preciso.',
  'auth.q.bodyFat.placeholder': '% de grasa corporal',
  'auth.q.bodyFat.error': 'Introduce un valor entre 1 y 70.',

  // step 6 — activity level
  'auth.q.activityLevel.title': '¿Qué tan activo eres en tu día a día?',
  'auth.q.activityLevel.subtitle': 'Piensa en tu trabajo y movimiento diario, no en el ejercicio.',
  'auth.q.activityLevel.sedentary': 'Sedentario',
  'auth.q.activityLevel.sedentaryDesc': 'Principalmente sentado (trabajo de escritorio)',
  'auth.q.activityLevel.light': 'Ligero',
  'auth.q.activityLevel.lightDesc': 'Movimiento ligero 1–3 días/semana',
  'auth.q.activityLevel.moderate': 'Moderado',
  'auth.q.activityLevel.moderateDesc': 'Actividad moderada 3–5 días/semana',
  'auth.q.activityLevel.active': 'Activo',
  'auth.q.activityLevel.activeDesc': 'Ejercicio intenso 6–7 días/semana',
  'auth.q.activityLevel.veryActive': 'Muy activo',
  'auth.q.activityLevel.veryActiveDesc': 'Ejercicio muy intenso o trabajo físico',

  // step 7 — training days (optional)
  'auth.q.trainingDays.title': '¿Cuántos días a la semana entrenas?',
  'auth.q.trainingDays.subtitle': 'Opcional — nos ayuda a ajustar tus macros.',

  // step 8 — goal
  'auth.q.goal.title': '¿Cuál es tu objetivo principal?',
  'auth.q.goal.subtitle': 'Calibraremos tus calorías y macros en consecuencia.',
  'auth.q.goal.loseFat': 'Bajar grasa',
  'auth.q.goal.maintain': 'Mantener',
  'auth.q.goal.gainMuscle': 'Ganar músculo',

  // step 9 — target weight (conditional, optional)
  'auth.q.targetWeight.title': '¿Cuál es tu peso objetivo?',
  'auth.q.targetWeight.subtitle': 'Opcional — nos ayuda a establecer un calendario para tu objetivo.',
  'auth.q.targetWeight.placeholder': 'Peso objetivo en kg',
  'auth.q.targetWeight.error': 'Introduce un peso objetivo válido mayor que 0.',

  // step 10 — pace (conditional)
  'auth.q.pace.title': '¿A qué ritmo quieres progresar?',
  'auth.q.pace.subtitle': 'Más rápido no siempre es mejor — el cambio sostenible dura más.',
  'auth.q.pace.conservative': 'Conservador (~0,25 kg/semana)',
  'auth.q.pace.moderate': 'Moderado (~0,5 kg/semana)',
  'auth.q.pace.aggressive': 'Agresivo (~0,75 kg/semana)',

  // step 11 — diet style
  'auth.q.dietStyle.title': '¿Qué estilo de dieta te encaja mejor?',
  'auth.q.dietStyle.subtitle': 'Construiremos tu plan de comidas en torno a tu preferencia.',
  'auth.q.dietStyle.standard': 'Equilibrada',
  'auth.q.dietStyle.highProtein': 'Alta en proteína',
  'auth.q.dietStyle.keto': 'Keto',
  'auth.q.dietStyle.vegetarianVegan': 'Vegetariana o vegana',

  // step 12 — allergies (optional, multi)
  'auth.q.allergies.title': '¿Tienes alguna alergia o intolerancia alimentaria?',
  'auth.q.allergies.subtitle': 'Opcional — selecciona todas las que apliquen.',
  'auth.q.allergies.none': 'Ninguna',
  'auth.q.allergies.gluten': 'Gluten',
  'auth.q.allergies.lactose': 'Lactosa',
  'auth.q.allergies.nuts': 'Frutos secos',
  'auth.q.allergies.shellfish': 'Mariscos',
  'auth.q.allergies.eggs': 'Huevos',
  'auth.q.allergies.soy': 'Soja',
  'auth.q.allergies.fish': 'Pescado',

  // step 13 — meals per day
  'auth.q.meals.title': '¿Cuántas comidas al día prefieres?',
  'auth.q.meals.subtitle': 'Adaptaremos tu plan a tu rutina.',
  'auth.q.meals.3': '3 comidas (desayuno, comida, cena)',
  'auth.q.meals.56': '5–6 comidas (con snacks)',

  // step 14 — pregnancy (conditional, female only)
  'auth.q.pregnancy.title': '¿Estás embarazada o en período de lactancia?',
  'auth.q.pregnancy.subtitle': 'Las necesidades calóricas y de nutrientes aumentan significativamente. Consulta siempre con un profesional de la salud.',
  'auth.q.pregnancy.none': 'No',
  'auth.q.pregnancy.pregnant': 'Embarazada',
  'auth.q.pregnancy.breastfeeding': 'Lactancia',

  // step 15 — medical conditions (optional, multi)
  'auth.q.medical.title': '¿Tienes alguna condición médica que debamos conocer?',
  'auth.q.medical.subtitle': 'Opcional. Para ciertas condiciones, consulta a un profesional de la salud antes de seguir cualquier plan nutricional.',
  'auth.q.medical.none': 'Ninguna',
  'auth.q.medical.diabetesT1': 'Diabetes tipo 1',
  'auth.q.medical.diabetesT2': 'Diabetes tipo 2',
  'auth.q.medical.hypertension': 'Hipertensión',
  'auth.q.medical.hypothyroidism': 'Hipotiroidismo',
  'auth.q.medical.kidneyDisease': 'Enfermedad renal',

  // step 16 — sleep (optional)
  'auth.q.sleep.title': '¿Cuántas horas duermes por noche?',
  'auth.q.sleep.subtitle': 'Opcional — la calidad del sueño influye en la recuperación y el metabolismo.',
  'auth.q.sleep.placeholder': 'Horas por noche',
  'auth.q.sleep.error': 'Introduce un valor entre 1 y 24.',

  // step 17 — stress (optional)
  'auth.q.stress.title': '¿Cómo describirías tu nivel de estrés?',
  'auth.q.stress.subtitle': 'Opcional — el estrés crónico puede afectar al peso y la recuperación.',
  'auth.q.stress.low': 'Bajo',
  'auth.q.stress.medium': 'Medio',
  'auth.q.stress.high': 'Alto',

  // step 18 — water intake (optional)
  'auth.q.water.title': '¿Cuántos vasos de agua bebes al día?',
  'auth.q.water.subtitle': 'Opcional — un vaso ≈ 250 ml.',
  'auth.q.water.placeholder': 'Vasos al día',
  'auth.q.water.error': 'Introduce un valor entre 0 y 50.',

  // step 19 — review
  'auth.q.review.title': 'Revisa tu perfil',
  'auth.q.review.subtitle': '¿Todo correcto? Toca Finalizar para crear tu plan personalizado.',
  'auth.q.review.sex': 'Sexo biológico',
  'auth.q.review.birthDate': 'Fecha de nacimiento',
  'auth.q.review.height': 'Altura',
  'auth.q.review.weight': 'Peso actual',
  'auth.q.review.bodyFat': 'Grasa corporal',
  'auth.q.review.activityLevel': 'Nivel de actividad',
  'auth.q.review.trainingDays': 'Días de entrenamiento/semana',
  'auth.q.review.goal': 'Objetivo',
  'auth.q.review.targetWeight': 'Peso objetivo',
  'auth.q.review.pace': 'Ritmo semanal',
  'auth.q.review.dietStyle': 'Estilo de dieta',
  'auth.q.review.allergies': 'Alergias',
  'auth.q.review.meals': 'Comidas al día',
  'auth.q.review.pregnancy': 'Estado de embarazo',
  'auth.q.review.medical': 'Condiciones médicas',
  'auth.q.review.sleep': 'Sueño',
  'auth.q.review.stress': 'Nivel de estrés',
  'auth.q.review.water': 'Ingesta de agua',
  'auth.q.review.notSet': 'No indicado',
  'auth.q.review.cmUnit': 'cm',
  'auth.q.review.kgUnit': 'kg',
  'auth.q.review.hrsUnit': 'hrs/noche',
  'auth.q.review.mlUnit': 'ml/día',
  'auth.q.review.daysUnit': 'días/semana',
  'auth.q.review.pctUnit': '%',
};
