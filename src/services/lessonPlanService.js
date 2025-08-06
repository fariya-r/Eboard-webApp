import { getFirestore, collection, query, where, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ✅ Initialize auth at the top before using it anywhere
const auth = getAuth();
const db = getFirestore();
const lessonPlansRef = collection(db, 'lessonPlans');

export const saveLessonPlan = async (lesson) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const newLesson = {
    ...lesson,
    createdBy: user.uid,
    createdAt: new Date(),
  };

  const docRef = await addDoc(lessonPlansRef, newLesson);
  return docRef.id;
};

export const getLessonPlans = async (userId) => {
  if (!userId) {
    console.error("❌ No user ID passed to getLessonPlans");
    return [];
  }
  console.log("Fetching plans for:", userId);

  const q = query(
    collection(db, "lessonPlans"),
    where("createdBy", "==", userId)
  );

  try {
    const snapshot = await getDocs(q);
    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return lessons;
  } catch (error) {
    console.error("❌ Error getting lesson plans:", error.message);
    return [];
  }
};




export const updateLessonPlan = async (id, updatedData) => {
  const docRef = doc(db, 'lessonPlans', id);
  await updateDoc(docRef, updatedData);
};

export const deleteLessonPlan = async (id) => {
  const docRef = doc(db, 'lessonPlans', id);
  await deleteDoc(docRef);
};
