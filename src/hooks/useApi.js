import { useState } from "react";
import api from "../lib/api";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = async (
    endpoint,
    method = "GET",
    payload = null,
    config = {},
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api({
        url: endpoint,
        method,
        data: payload,
        ...config,
      });

      setData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const get = (endpoint, config) => execute(endpoint, "GET", null, config);
  const post = (endpoint, data, config) =>
    execute(endpoint, "POST", data, config);
  const put = (endpoint, data, config) =>
    execute(endpoint, "PUT", data, config);
  const del = (endpoint, config) => execute(endpoint, "DELETE", null, config);

  return { loading, error, data, get, post, put, del, execute };
};
