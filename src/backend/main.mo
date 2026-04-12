import Types "types/study";
import StudyMixin "mixins/study-api";

import List "mo:core/List";
import Map "mo:core/Map";


actor {
  // Java equivalent: ArrayList<User> users = new ArrayList<>()
  let users = List.empty<Types.User>();
  // Java equivalent: ArrayList<Subject> subjects = new ArrayList<>()
  let subjects = List.empty<Types.Subject>();
  // Java equivalent: ArrayList<TaskUnit> tasks = new ArrayList<>()   — managed by TaskManager
  let tasks = List.empty<Types.TaskUnit>();
  // Java equivalent: ArrayList<ProgressLog> logs = new ArrayList<>()
  let logs = List.empty<Types.ProgressLog>();
  // Java equivalent: HashMap<Integer, FocusSession> activeSessions = new HashMap<>()  — managed by SessionManager
  let activeSessions = Map.empty<Nat, Types.ActiveFocusSession>();

  include StudyMixin(users, subjects, tasks, logs, activeSessions);
};
