const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const {
  findAllStudents,
  findStudentDetail,
  findStudentToSetStatus,
  addOrUpdateStudent,
  deleteStudentById,
} = require("./students-repository");
const { findUserById } = require("../../shared/repository");

const STUDENT_ROLE_ID = 3;

const parseId = (id) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "Invalid student id");
  }
  return parsed;
};

const checkStudentId = async (id) => {
  const isStudentFound = await findUserById(id);
  if(!isStudentFound || isStudentFound.role_id !== STUDENT_ROLE_ID) {
    throw new ApiError(404, "Student not found");
  }
};

const getAllStudents = async (payload) => {
  const students = await findAllStudents(payload);
  if (students.length <= 0) {
    throw new ApiError(404, "Students not found");
  }

  return students;
};

const getStudentDetail = async (rawid) => {
  const id = parseId(rawid);
  await checkStudentId(id);

  const student = await findStudentDetail(id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

const addNewStudent = async (payload) => {
  if (!payload || !payload.name || !payload.email) {
    throw new ApiError(400, "Name and email are required");
  }
  const ADD_STUDENT_AND_EMAIL_SEND_SUCCESS =
    "Student added and verification email sent successfully.";
  const ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL =
    "Student added, but failed to send verification email.";
  try {
    const result = await addOrUpdateStudent(payload);
    if (!result.status) {
      throw new ApiError(500, result.message);
    }

    try {
      await sendAccountVerificationEmail({
        userId: result.userId,
        userEmail: payload.email,
      });
      return { message: ADD_STUDENT_AND_EMAIL_SEND_SUCCESS };
    } catch (error) {
      return { message: ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Unable to add student");
  }
};

const updateStudent = async (payload) => {
  const userId = parseId(payload.userId);
  await checkStudentId(userId);

  const result = await addOrUpdateStudent(payload);
  if (!result.status) {
    throw new ApiError(500, result.message);
  }

  return { message: result.message };
};

const setStudentStatus = async ({ userId : rawUserId , reviewerId, status }) => {
  const userId = parseId(rawUserId);
  if (typeof status !== "boolean") {
    throw new ApiError(400, "Status must be a boolean");
  }

  await checkStudentId(userId);

  const affectedRow = await findStudentToSetStatus({
    userId,
    reviewerId,
    status,
  });
  if (affectedRow <= 0) {
    throw new ApiError(500, "Unable to disable student");
  }

  return { message: "Student status changed successfully" };
};

const deleteStudent = async (rawId) => {
  const id = parseId(rawId);
  await checkStudentId(id);

  const deleted = await deleteStudentById(id);
  if (deleted <= 0) {
    throw new ApiError(500, "Unable to delete student");
  }

  return { message: "Student deleted successfully" };
};

module.exports = {
  deleteStudent,
  getAllStudents,
  getStudentDetail,
  addNewStudent,
  setStudentStatus,
  updateStudent,
};
